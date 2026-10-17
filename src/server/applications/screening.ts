import "server-only";

import { REFERRED_STAGE } from "@/lib/candidate-activity";
import type { CompanyInterview } from "@/lib/company-activity";
import {
  OUTCOME_LABELS,
  PLACE_COLUMNS,
  interviewEnd,
  interviewPlace,
  modeLabel,
  type InterviewInput,
  type InterviewOutcome,
  type InterviewPlaceRow,
} from "@/lib/interviews";
import type { Resume } from "@/lib/resume";
import type { ScreeningApplication, ScreeningState } from "@/lib/screening";
import { createAdminClient } from "@/lib/supabase/server";
import { interviewFields } from "@/server/applications/company";
import { maskResume } from "@/server/applications/masking";

// JobClubb's side of the employer agreement: preliminary screening, the
// first-round interview, shortlisting and referral to the employer. Admin only.

const REF = /^JC-[0-9A-Z]{6}$/;
const UUID = /^[0-9a-f-]{36}$/i;

type InterviewRow = InterviewPlaceRow & {
  id: string;
  host: "company" | "jobclubb";
  starts_at: string;
  duration_mins: number;
  finished_at: string | null;
  cancelled_at: string | null;
  mode: string;
  interviewer: string;
  round_no: number;
  round: string;
  outcome: InterviewOutcome | null;
};

type Row = {
  ref: string;
  job_id: string;
  stage: number;
  status: "active" | "rejected";
  city: string;
  experience_months: number;
  job_title: string;
  company_name: string;
  created_at: string;
  screening_cleared_at: string | null;
  candidates: { first_name: string; last_name: string; phone: string };
  company_jobs: { status: string };
  job_interviews: InterviewRow[];
};

const BASE_COLUMNS = `ref, job_id, stage, status, city, experience_months, job_title, company_name, created_at, screening_cleared_at, job_interviews (id, host, starts_at, duration_mins, finished_at, cancelled_at, mode, ${PLACE_COLUMNS}, interviewer, round_no, round, outcome)`;
const LIST_COLUMNS = `${BASE_COLUMNS}, candidates (first_name, last_name, phone), company_jobs (status)`;

const screeningInterview = (row: Row) =>
  row.job_interviews.find((i) => i.host === "jobclubb" && !i.cancelled_at) ?? null;

function stateOf(row: Row): ScreeningState {
  if (row.status === "rejected") return "not_selected";
  if (row.stage >= REFERRED_STAGE) return "referred";
  if (row.company_jobs.status === "closed") return "closed";
  if (row.screening_cleared_at) return "shortlisted";
  return row.stage === 1 ? "interview" : "new";
}

function toScreening(row: Row): ScreeningApplication {
  const state = stateOf(row);
  return {
    ref: row.ref,
    candidateName: `${row.candidates.first_name} ${row.candidates.last_name}`,
    candidatePhone: row.candidates.phone,
    city: row.city,
    experienceMonths: row.experience_months,
    designation: row.job_title,
    companyName: row.company_name,
    state,
    rejectedBy:
      state === "not_selected" ? (row.stage >= REFERRED_STAGE ? "employer" : "jobclubb") : null,
    appliedOn: row.created_at,
    interviewAt: screeningInterview(row)?.starts_at ?? null,
  };
}

export async function listScreeningApplications(): Promise<ScreeningApplication[]> {
  const { data, error } = await createAdminClient()
    .from("job_applications")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as Row[]).map(toScreening);
}

export async function countApplicationsToScreen() {
  const { count, error } = await createAdminClient()
    .from("job_applications")
    .select("id, company_jobs!inner (status)", { count: "exact", head: true })
    .eq("status", "active")
    .eq("company_jobs.status", "live")
    .or("stage.eq.0,and(stage.eq.1,screening_cleared_at.not.is.null)");
  if (error) {
    console.error("Counting applications to screen failed", error);
    return 0;
  }
  return count ?? 0;
}

export type ScreeningDetail = ScreeningApplication & {
  candidateEmail: string;
  jobId: string;
  jobLocation: { city: string; pincode: string };
  resume: Resume;
  referralNote: string;
  referredAt: string | null;
  interview: CompanyInterview | null;
  employerRounds: { roundNo: number; round: string; startsAt: string; outcome: string | null }[];
  placementId: string | null;
};

function toInterview(row: InterviewRow, ref: string, jobId: string, applicant: string, designation: string): CompanyInterview {
  return {
    id: row.id,
    applicantRef: ref,
    applicant,
    jobId,
    designation,
    startsAt: row.starts_at,
    endsAt: interviewEnd(row.starts_at, row.duration_mins, row.finished_at),
    durationMins: row.duration_mins,
    mode: modeLabel(row.mode),
    ...interviewPlace(row),
    interviewer: row.interviewer,
    roundNo: row.round_no,
    round: row.round,
    outcome: row.outcome ? OUTCOME_LABELS[row.outcome] : null,
  };
}

export async function getScreeningApplication(ref: string): Promise<ScreeningDetail | null> {
  if (!REF.test(ref)) return null;
  const { data, error } = await createAdminClient()
    .from("job_applications")
    .select(
      `${BASE_COLUMNS}, resume, referral_note, shortlisted_at, candidates (first_name, last_name, phone, email), company_jobs (status, city, pincode), placements (id)`,
    )
    .eq("ref", ref)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as Row & {
    resume: Resume;
    referral_note: string | null;
    shortlisted_at: string | null;
    candidates: Row["candidates"] & { email: string };
    company_jobs: { status: string; city: string; pincode: string };
    placements: { id: string } | { id: string }[] | null;
  };
  const base = toScreening(row);
  const interview = screeningInterview(row);
  const placement = Array.isArray(row.placements) ? row.placements[0] : row.placements;
  return {
    ...base,
    candidateEmail: row.candidates.email,
    jobId: row.job_id,
    jobLocation: { city: row.company_jobs.city, pincode: row.company_jobs.pincode },
    resume: row.resume,
    referralNote: row.referral_note ?? "",
    referredAt: row.stage >= REFERRED_STAGE ? row.shortlisted_at : null,
    interview: interview
      ? toInterview(interview, row.ref, row.job_id, base.candidateName, row.job_title)
      : null,
    employerRounds: row.job_interviews
      .filter((i) => i.host === "company" && !i.cancelled_at)
      .sort((a, b) => a.round_no - b.round_no)
      .map((i) => ({
        roundNo: i.round_no,
        round: i.round,
        startsAt: i.starts_at,
        outcome: i.outcome ? OUTCOME_LABELS[i.outcome] : null,
      })),
    placementId: placement?.id ?? null,
  };
}

const now = () => new Date().toISOString();

export async function scheduleScreeningInterview(ref: string, input: InterviewInput) {
  if (!REF.test(ref)) return null;
  const admin = createAdminClient();
  const { data: app, error } = await admin
    .from("job_applications")
    .select("id, company_id")
    .eq("ref", ref)
    .maybeSingle();
  if (error) throw error;
  if (!app) return null;

  const { data, error: insertError } = await admin
    .from("job_interviews")
    .insert({
      ...interviewFields(input),
      host: "jobclubb",
      application_id: app.id,
      company_id: app.company_id,
      round_no: 0,
    })
    .select("id")
    .single();
  if (!insertError) return data.id as string;
  if (insertError.hint === "not_ready_for_interview" || insertError.code === "23505") return null;
  throw insertError;
}

function openScreeningInterview(id: string, update: Record<string, unknown>) {
  return createAdminClient()
    .from("job_interviews")
    .update(update)
    .eq("host", "jobclubb")
    .eq("id", id)
    .is("cancelled_at", null)
    .is("outcome", null);
}

export async function rescheduleScreeningInterview(id: string, input: InterviewInput) {
  if (!UUID.test(id)) return false;
  const { data, error } = await openScreeningInterview(id, interviewFields(input)).select("id");
  if (error) throw error;
  return data.length > 0;
}

export async function cancelScreeningInterview(id: string) {
  if (!UUID.test(id)) return false;
  const { data, error } = await openScreeningInterview(id, { cancelled_at: now() }).select("id");
  if (error) throw error;
  return data.length > 0;
}

export async function finishScreeningInterview(id: string) {
  if (!UUID.test(id)) return false;
  const at = now();
  const { data, error } = await openScreeningInterview(id, { finished_at: at })
    .is("finished_at", null)
    .lte("starts_at", at)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

export async function recordScreeningOutcome(id: string, outcome: InterviewOutcome) {
  if (!UUID.test(id) || (outcome !== "next_round" && outcome !== "not_selected")) return false;
  const at = now();
  const { data, error } = await openScreeningInterview(id, { outcome, outcome_at: at })
    .lte("starts_at", at)
    .select("id");
  if (error?.hint === "interview_not_finished") return false;
  if (error) throw error;
  return data.length > 0;
}

// For candidates JobClubb already knows well enough to skip its own interview.
export async function shortlistWithoutInterview(ref: string) {
  if (!REF.test(ref)) return false;
  const at = now();
  const { data, error } = await createAdminClient()
    .from("job_applications")
    .update({ stage: 1, screening_cleared_at: at, updated_at: at })
    .eq("ref", ref)
    .eq("stage", 0)
    .eq("status", "active")
    .select("ref");
  if (error) throw error;
  return data.length > 0;
}

export type ReferResult = { ok: true } | { ok: false; error: string };

export async function referToEmployer(ref: string, note: string): Promise<ReferResult | null> {
  if (!REF.test(ref)) return null;
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("job_applications")
    .select("stage, status, screening_cleared_at, resume, candidates (first_name, last_name), company_jobs (status)")
    .eq("ref", ref)
    .maybeSingle();
  if (error) throw error;
  if (!row || row.status !== "active" || row.stage !== 1 || !row.screening_cleared_at) return null;
  if ((row.company_jobs as unknown as { status: string }).status !== "live")
    return { ok: false, error: "This job has closed, so the employer is no longer reviewing candidates for it." };

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
      stage: REFERRED_STAGE,
      shortlisted_at: at,
      masked_resume: masked,
      referral_note: note || null,
      updated_at: at,
    })
    .eq("ref", ref)
    .eq("stage", 1)
    .eq("status", "active")
    .select("ref");
  if (updateError) throw updateError;
  return data.length > 0 ? { ok: true } : null;
}

// Returns whether JobClubb had already interviewed them, for the email's wording.
export async function rejectAtScreening(ref: string) {
  if (!REF.test(ref)) return null;
  const admin = createAdminClient();
  const { count, error: interviewError } = await admin
    .from("job_interviews")
    .select("id, job_applications!inner (ref)", { count: "exact", head: true })
    .eq("job_applications.ref", ref)
    .eq("host", "jobclubb")
    .is("cancelled_at", null)
    .lte("starts_at", now());
  if (interviewError) throw interviewError;

  const at = now();
  const { data, error } = await admin
    .from("job_applications")
    .update({ status: "rejected", rejected_at: at, updated_at: at })
    .eq("ref", ref)
    .eq("status", "active")
    .lt("stage", REFERRED_STAGE)
    .select("ref");
  if (error) throw error;
  return data.length > 0 ? { afterInterview: !!count } : null;
}
