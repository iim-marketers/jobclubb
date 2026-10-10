import "server-only";

import { randomInt } from "node:crypto";

import { formatShortDate, type Application } from "@/lib/candidate-activity";
import type { Resume } from "@/lib/resume";
import { createAdminClient } from "@/lib/supabase/server";
import {
  experienceMonths,
  maskResume,
  resumeSkills,
} from "@/server/applications/masking";
import {
  PUBLIC_JOB_COLUMNS,
  toPublicJob,
  type PublicJobRow,
} from "@/server/companies/jobs";
import { postedAgo, toListing } from "@/server/jobs/listings";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const REF = /^JC-[0-9A-Z]{6}$/;
const REF_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function newRef() {
  let ref = "JC-";
  for (let i = 0; i < 6; i++) ref += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  return ref;
}

type ApplyingCandidate = {
  id: string;
  first_name: string;
  last_name: string;
  city: string;
};

export type ApplyResult =
  | { ok: true; ref: string }
  | { ok: false; reason: "job_not_live" | "no_resume" };

export async function applyToJob(candidate: ApplyingCandidate, slug: string): Promise<ApplyResult> {
  if (!SLUG.test(slug)) return { ok: false, reason: "job_not_live" };
  const admin = createAdminClient();

  const [jobResult, resumeResult] = await Promise.all([
    admin.from("company_jobs").select("id").eq("slug", slug).eq("status", "live").maybeSingle(),
    admin.from("candidate_resumes").select("resume").eq("candidate_id", candidate.id).maybeSingle(),
  ]);
  if (jobResult.error) throw jobResult.error;
  if (resumeResult.error) throw resumeResult.error;
  if (!jobResult.data) return { ok: false, reason: "job_not_live" };
  if (!resumeResult.data) return { ok: false, reason: "no_resume" };

  const resume = resumeResult.data.resume as Resume;
  const masked = maskResume(
    resume,
    { firstName: candidate.first_name, lastName: candidate.last_name },
    { revealName: false },
  );

  for (let attempt = 0; ; attempt++) {
    const { data, error } = await admin
      .from("job_applications")
      .insert({
        ref: newRef(),
        job_id: jobResult.data.id,
        candidate_id: candidate.id,
        city: candidate.city,
        experience_months: experienceMonths(resume),
        skills: resumeSkills(masked),
        resume,
        masked_resume: masked,
      })
      .select("ref")
      .single();
    if (!error) return { ok: true, ref: data.ref as string };

    if (error.hint === "job_not_live") return { ok: false, reason: "job_not_live" };
    if (error.code === "23505" && error.message.includes("job_applications_job_candidate_key")) {
      const existing = await findApplicationRef(candidate.id, jobResult.data.id);
      if (existing) return { ok: true, ref: existing };
    }
    const refTaken = error.code === "23505" && error.message.includes("job_applications_ref_key");
    if (!refTaken || attempt >= 2) throw error;
  }
}

async function findApplicationRef(candidateId: string, jobId: string) {
  const { data, error } = await createAdminClient()
    .from("job_applications")
    .select("ref")
    .eq("candidate_id", candidateId)
    .eq("job_id", jobId)
    .maybeSingle();
  if (error) throw error;
  return (data?.ref as string | undefined) ?? null;
}

export type ApplyState =
  | { kind: "ready" }
  | { kind: "no-resume" }
  | { kind: "applied"; ref: string };

export async function getApplyState(candidateId: string, slug: string): Promise<ApplyState> {
  const admin = createAdminClient();
  const [application, resume] = await Promise.all([
    admin
      .from("job_applications")
      .select("ref, company_jobs!inner (slug)")
      .eq("candidate_id", candidateId)
      .eq("company_jobs.slug", slug)
      .maybeSingle(),
    admin
      .from("candidate_resumes")
      .select("candidate_id", { count: "exact", head: true })
      .eq("candidate_id", candidateId),
  ]);
  if (application.error) throw application.error;
  if (resume.error) throw resume.error;

  if (application.data) return { kind: "applied", ref: application.data.ref as string };
  return resume.count ? { kind: "ready" } : { kind: "no-resume" };
}

const APPLICATION_COLUMNS = `ref, stage, status, created_at, viewed_at, shortlisted_at, rejected_at, company_jobs (${PUBLIC_JOB_COLUMNS})`;

type ApplicationRow = {
  ref: string;
  stage: number;
  status: "active" | "rejected";
  created_at: string;
  viewed_at: string | null;
  shortlisted_at: string | null;
  rejected_at: string | null;
  company_jobs: PublicJobRow;
};

function latestUpdate(a: Application, row: ApplicationRow) {
  if (a.status === "rejected")
    return "The employer has decided not to move forward with this application. New roles are added every day, so keep applying.";
  if (a.status === "closed")
    return "This posting has closed and the employer is no longer reviewing applications for it.";
  if (row.stage >= 2)
    return "You've been shortlisted. The employer can now see your name; your phone number and email stay private.";
  if (row.stage === 1) return "The employer has opened your profile.";
  return "Your application has been delivered to the employer.";
}

function toApplication(row: ApplicationRow): Application {
  const job = toPublicJob(row.company_jobs);
  const events = [
    { label: "Applied", at: row.created_at },
    row.viewed_at && { label: "Viewed by employer", at: row.viewed_at },
    row.shortlisted_at && { label: "Shortlisted", at: row.shortlisted_at },
    row.rejected_at && { label: "Not selected", at: row.rejected_at },
  ].filter((e): e is { label: string; at: string } => !!e);

  const application: Application = {
    id: row.ref,
    job: toListing(job),
    stage: row.stage,
    status: row.status === "rejected" ? "rejected" : job.status === "closed" ? "closed" : "active",
    appliedOn: row.created_at,
    updatedAgo: postedAgo(events[events.length - 1].at),
    update: "",
    history: events.map((e) => ({ label: e.label, date: formatShortDate(e.at) })),
  };
  application.update = latestUpdate(application, row);
  return application;
}

export async function listCandidateApplications(candidateId: string): Promise<Application[]> {
  const { data, error } = await createAdminClient()
    .from("job_applications")
    .select(APPLICATION_COLUMNS)
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as ApplicationRow[]).map(toApplication);
}

export async function getCandidateApplication(candidateId: string, ref: string) {
  if (!REF.test(ref)) return null;
  const { data, error } = await createAdminClient()
    .from("job_applications")
    .select(APPLICATION_COLUMNS)
    .eq("candidate_id", candidateId)
    .eq("ref", ref)
    .maybeSingle();
  if (error) throw error;
  return data ? toApplication(data as unknown as ApplicationRow) : null;
}
