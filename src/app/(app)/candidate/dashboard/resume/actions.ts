"use server";

import { revalidatePath } from "next/cache";

import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { keywordScore } from "@/lib/resume";
import { VERTICALS } from "@/lib/taxonomy";
import { requireMember } from "@/server/auth/current-candidate";
import {
  deleteResume,
  extractKeywords,
  generateResume,
  getSavedResume,
  pdfToText,
  saveResume,
} from "@/server/resume/ats-resume";

const RESUME_PATH = `${CANDIDATE_HOME}/resume`;
const MAX_PDF_BYTES = 5 * 1024 * 1024;
const COOLDOWN_MS = 30_000;

export type ResumeActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<"targetRole" | "oldResume" | "additions", string>>;
};

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

export async function buildAtsResume(
  _prev: ResumeActionState,
  formData: FormData,
): Promise<ResumeActionState> {
  const candidate = await requireMember(RESUME_PATH);
  const sector = VERTICALS.find((v) => v.slug === candidate.vertical)?.name;

  const targetRole = text(formData, "targetRole", 120);
  const jobDescription = text(formData, "jobDescription", 12_000);
  const additions = text(formData, "additions", 4_000);
  const feedback = text(formData, "feedback", 2_000);
  const file = formData.get("oldResume");
  const pdf = file instanceof File && file.size > 0 ? file : null;

  const previous = await getSavedResume(candidate.id);
  const fieldErrors: ResumeActionState["fieldErrors"] = {};
  if (!targetRole) fieldErrors.targetRole = "Enter the role you're applying for.";
  if (pdf && pdf.type !== "application/pdf") fieldErrors.oldResume = "Upload your resume as a PDF.";
  else if (pdf && pdf.size > MAX_PDF_BYTES) fieldErrors.oldResume = "PDF must be 5 MB or smaller.";
  if (!pdf && !additions && !previous)
    fieldErrors.additions = "Upload your current resume or tell us about your experience.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  if (previous && Date.now() - new Date(previous.generatedAt).getTime() < COOLDOWN_MS)
    return { error: "You just generated a resume. Give it 30 seconds before trying again." };

  try {
    let oldResume: string | undefined;
    if (pdf) {
      oldResume = (await pdfToText(pdf)).slice(0, 15_000);
      if (!oldResume)
        return { fieldErrors: { oldResume: "We couldn't read any text in that PDF. Is it a scanned image?" } };
    }

    const reuseKeywords =
      previous &&
      previous.targetRole === targetRole &&
      (previous.jobDescription ?? "") === jobDescription;
    const keywords = reuseKeywords
      ? previous.keywords
      : await extractKeywords({ targetRole, sector, jobDescription: jobDescription || undefined });

    const resume = await generateResume({
      targetRole,
      sector,
      keywords,
      oldResume,
      additions: additions || undefined,
      feedback: feedback || undefined,
      previous: oldResume ? undefined : previous?.resume,
    });

    const saved = await saveResume(candidate.id, {
      targetRole,
      jobDescription: jobDescription || null,
      keywords,
      resume,
      originalScore: oldResume
        ? keywordScore(oldResume, keywords)
        : reuseKeywords
          ? previous.originalScore
          : null,
    });
    if (!saved) return { error: "Your resume was generated but couldn't be saved. Please try again." };
  } catch (error) {
    console.error("ATS resume generation failed", error);
    return { error: "We couldn't generate your resume right now. Please try again in a minute." };
  }

  revalidatePath(RESUME_PATH);
  return { ok: true };
}

export async function clearResume(): Promise<{ error?: string }> {
  const candidate = await requireMember(RESUME_PATH);
  if (!(await deleteResume(candidate.id)))
    return { error: "We couldn't clear your resume. Please try again." };
  revalidatePath(RESUME_PATH);
  return {};
}
