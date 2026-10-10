import "server-only";

import type { Applicant } from "@/lib/company-activity";
import type { Resume } from "@/lib/resume";
import { createAdminClient } from "@/lib/supabase/server";
import { maskResume } from "@/server/applications/masking";

// Every query here bypasses RLS: each must filter on company_id, and none may
// return candidate_id, candidate_name, the unmasked resume, email or phone to
// the caller. Names are revealed only through revealedNames().

const REF = /^JC-[0-9A-Z]{6}$/;
const UUID = /^[0-9a-f-]{36}$/i;

const APPLICANT_COLUMNS =
  "ref, job_id, candidate_id, city, experience_months, skills, stage, status, created_at, shortlisted_at";

type ApplicantRow = {
  ref: string;
  job_id: string;
  candidate_id: string;
  city: string;
  experience_months: number;
  skills: string[];
  stage: number;
  status: Applicant["status"];
  created_at: string;
  shortlisted_at: string | null;
};

async function revealedNames(rows: ApplicantRow[]) {
  const ids = rows.filter((r) => r.shortlisted_at).map((r) => r.candidate_id);
  if (ids.length === 0) return new Map<string, string>();
  const { data, error } = await createAdminClient()
    .from("candidates")
    .select("id, first_name, last_name")
    .in("id", ids);
  if (error) throw error;
  return new Map(data.map((c) => [c.id as string, `${c.first_name} ${c.last_name}`]));
}

function toApplicant(row: ApplicantRow, names: Map<string, string>): Applicant {
  return {
    ref: row.ref,
    jobId: row.job_id,
    name: row.shortlisted_at ? (names.get(row.candidate_id) ?? null) : null,
    experienceMonths: row.experience_months,
    city: row.city,
    skills: row.skills,
    stage: row.stage,
    status: row.status,
    appliedOn: row.created_at,
  };
}

export async function listCompanyApplicants(companyId: string, jobId?: string) {
  let query = createAdminClient()
    .from("job_applications")
    .select(APPLICANT_COLUMNS)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (jobId) {
    if (!UUID.test(jobId)) return [];
    query = query.eq("job_id", jobId);
  }
  const { data, error } = await query;
  if (error) throw error;
  const rows = data as ApplicantRow[];
  const names = await revealedNames(rows);
  return rows.map((r) => toApplicant(r, names));
}

export type ApplicantDetail = Applicant & {
  designation: string;
  jobClosed: boolean;
  resume: Resume;
};

export async function getCompanyApplicant(
  companyId: string,
  ref: string,
): Promise<ApplicantDetail | null> {
  if (!REF.test(ref)) return null;
  const { data, error } = await createAdminClient()
    .from("job_applications")
    .select(`${APPLICANT_COLUMNS}, masked_resume, company_jobs (designation, status)`)
    .eq("company_id", companyId)
    .eq("ref", ref)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as ApplicantRow & {
    masked_resume: Resume;
    company_jobs: { designation: string; status: string };
  };
  const names = await revealedNames([row]);
  return {
    ...toApplicant(row, names),
    designation: row.company_jobs.designation,
    jobClosed: row.company_jobs.status === "closed",
    resume: row.masked_resume,
  };
}

const now = () => new Date().toISOString();

export async function markApplicantViewed(companyId: string, ref: string) {
  if (!REF.test(ref)) return false;
  const at = now();
  const { data, error } = await createAdminClient()
    .from("job_applications")
    .update({ stage: 1, viewed_at: at, updated_at: at })
    .eq("company_id", companyId)
    .eq("ref", ref)
    .eq("stage", 0)
    .eq("status", "active")
    .select("ref");
  if (error) throw error;
  return data.length > 0;
}

export type ShortlistResult = "shortlisted" | "unchanged";

export async function shortlistApplicant(companyId: string, ref: string): Promise<ShortlistResult> {
  if (!REF.test(ref)) return "unchanged";
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("job_applications")
    .select("candidate_id, stage, status, viewed_at, resume, candidates (first_name, last_name)")
    .eq("company_id", companyId)
    .eq("ref", ref)
    .maybeSingle();
  if (error) throw error;
  if (!row || row.status !== "active" || row.stage >= 2) return "unchanged";

  const candidate = row.candidates as unknown as { first_name: string; last_name: string };
  const masked = maskResume(
    row.resume as Resume,
    { firstName: candidate.first_name, lastName: candidate.last_name },
    { revealName: true },
  );

  const at = now();
  const { data, error: updateError } = await admin
    .from("job_applications")
    .update({
      stage: 2,
      viewed_at: row.viewed_at ?? at,
      shortlisted_at: at,
      masked_resume: masked,
      updated_at: at,
    })
    .eq("company_id", companyId)
    .eq("ref", ref)
    .eq("stage", row.stage)
    .eq("status", "active")
    .select("ref");
  if (updateError) throw updateError;
  return data.length > 0 ? "shortlisted" : "unchanged";
}

// Offers (stage 4) are settled through JobClubb, so they can't be rejected here.
export async function rejectApplicant(companyId: string, ref: string) {
  if (!REF.test(ref)) return false;
  const at = now();
  const { data, error } = await createAdminClient()
    .from("job_applications")
    .update({ status: "rejected", rejected_at: at, updated_at: at })
    .eq("company_id", companyId)
    .eq("ref", ref)
    .eq("status", "active")
    .lt("stage", 4)
    .select("ref");
  if (error) throw error;
  return data.length > 0;
}
