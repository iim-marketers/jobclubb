import "server-only";

import OpenAI from "openai";
import { extractText, getDocumentProxy } from "unpdf";

import { RESUME_JSON_SCHEMA, type Resume, type SavedResume } from "@/lib/resume";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

let client: OpenAI | undefined;
function openai() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set.");
  return (client ??= new OpenAI());
}

async function structured<T>(name: string, schema: object, instructions: string, input: string) {
  const response = await openai().responses.create({
    model: MODEL,
    instructions,
    input,
    text: { format: { type: "json_schema", name, schema: schema as Record<string, unknown>, strict: true } },
  });
  return JSON.parse(response.output_text) as T;
}

export async function pdfToText(file: File) {
  const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
  const { text } = await extractText(pdf, { mergePages: true });
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export async function extractKeywords({
  targetRole,
  sector,
  jobDescription,
}: {
  targetRole: string;
  sector?: string;
  jobDescription?: string;
}) {
  const source = jobDescription
    ? `Job description:\n${jobDescription}`
    : `No job description was given. Use the skills, duties and terms that job postings for a "${targetRole}" role${sector ? ` in ${sector}` : ""} in India most commonly list.`;

  const { keywords } = await structured<{ keywords: string[] }>(
    "ats_keywords",
    {
      type: "object",
      additionalProperties: false,
      required: ["keywords"],
      properties: { keywords: { type: "array", items: { type: "string" } } },
    },
    "You extract the keywords an applicant tracking system screens resumes for: hard skills, tools and systems, certifications, domain terms and core duties. " +
      "Return 15 to 25 short keywords of one to three words each, as they would appear in a resume. " +
      "Leave out soft filler such as 'team player', company names, locations and salary.",
    `Target role: ${targetRole}\n\n${source}`,
  );

  const seen = new Set<string>();
  return keywords
    .map((k) => k.trim())
    .filter((k) => k && !seen.has(k.toLowerCase()) && seen.add(k.toLowerCase()))
    .slice(0, 25);
}

export async function generateResume(input: {
  targetRole: string;
  sector?: string;
  keywords: string[];
  oldResume?: string;
  additions?: string;
  feedback?: string;
  previous?: Resume;
}) {
  const sections = [
    `Target role: ${input.targetRole}${input.sector ? ` (${input.sector})` : ""}`,
    `Keywords to work in where the candidate's background supports them: ${input.keywords.join(", ")}`,
    input.oldResume && `Existing resume (extracted from PDF):\n${input.oldResume}`,
    input.additions && `Extra details from the candidate:\n${input.additions}`,
    input.previous && `Current generated resume (revise this):\n${JSON.stringify(input.previous)}`,
    input.feedback && `Changes the candidate asked for:\n${input.feedback}`,
  ].filter(Boolean);

  return structured<Resume>(
    "ats_resume",
    RESUME_JSON_SCHEMA,
    [
      "You are an expert resume writer for airline, hospitality and travel jobs in India, specialising in ATS-friendly resumes.",
      "Write a concise, single-column resume from the candidate's own material.",
      "Never invent employers, job titles, dates, qualifications, certifications or numbers. If a detail is missing, leave it out or use an empty string; use an empty array when a section has no facts.",
      "Use the target keywords naturally, and only where the candidate's experience supports them.",
      "Headline: the target role plus one differentiator. Summary: 2 to 3 sentences.",
      "Experience: most recent first, 3 to 5 bullets each, starting with a strong action verb and keeping any figures the candidate gave. Dates as 'Mon YYYY', and 'Present' for a current role.",
      "Group skills into 2 to 4 plain categories such as 'Guest service' or 'Systems & tools'.",
      "Use plain text only: no markdown, emoji or special symbols.",
    ].join("\n"),
    sections.join("\n\n"),
  );
}

export async function getSavedResume(candidateId: string): Promise<SavedResume | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("candidate_resumes")
    .select("target_role, job_description, keywords, resume, original_score, generated_at")
    .eq("candidate_id", candidateId)
    .maybeSingle();
  if (!data) return null;
  return {
    targetRole: data.target_role,
    jobDescription: data.job_description,
    keywords: data.keywords,
    resume: data.resume as Resume,
    originalScore: data.original_score,
    generatedAt: data.generated_at,
  };
}

export async function saveResume(candidateId: string, saved: Omit<SavedResume, "generatedAt">) {
  const { error } = await createAdminClient()
    .from("candidate_resumes")
    .upsert({
      candidate_id: candidateId,
      target_role: saved.targetRole,
      job_description: saved.jobDescription,
      keywords: saved.keywords,
      resume: saved.resume,
      original_score: saved.originalScore,
      generated_at: new Date().toISOString(),
    });
  if (error) console.error("Saving resume failed", error);
  return !error;
}

export async function deleteResume(candidateId: string) {
  const { error } = await createAdminClient()
    .from("candidate_resumes")
    .delete()
    .eq("candidate_id", candidateId);
  if (error) console.error("Deleting resume failed", error);
  return !error;
}
