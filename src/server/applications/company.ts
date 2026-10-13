import "server-only";

import {
  candidateLabel,
  type Applicant,
  type CompanyInterview,
  type SelectedCandidate,
} from "@/lib/company-activity";
import {
  MAX_ROUNDS,
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
import { createAdminClient } from "@/lib/supabase/server";
import { maskResume } from "@/server/applications/masking";

// Every query here bypasses RLS: each must filter on company_id, and none may
// return candidate_id, candidate_name, the unmasked resume, email or phone to
// the caller. Names are revealed only through revealedNames().

const REF = /^JC-[0-9A-Z]{6}$/;
const UUID = /^[0-9a-f-]{36}$/i;

const APPLICANT_COLUMNS =
  "ref, job_id, candidate_id, candidate_no, city, experience_months, skills, stage, status, created_at, shortlisted_at";

type ApplicantRow = {
  ref: string;
  job_id: string;
  candidate_id: string;
  candidate_no: number;
  city: string;
  experience_months: number;
  skills: string[];
  stage: number;
  status: Applicant["status"];
  created_at: string;
  shortlisted_at: string | null;
  job_interviews?: { outcome: InterviewOutcome | null }[];
};

async function revealedNames(rows: Pick<ApplicantRow, "candidate_id" | "shortlisted_at">[]) {
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
    label: candidateLabel(row.candidate_no),
    name: row.shortlisted_at ? (names.get(row.candidate_id) ?? null) : null,
    experienceMonths: row.experience_months,
    city: row.city,
    skills: row.skills,
    stage: row.stage,
    status: row.status,
    selected: !!row.job_interviews?.some((i) => i.outcome === "selected"),
    appliedOn: row.created_at,
  };
}

export async function listCompanyApplicants(companyId: string, jobId?: string) {
  let query = createAdminClient()
    .from("job_applications")
    .select(`${APPLICANT_COLUMNS}, job_interviews (outcome)`)
    .eq("company_id", companyId)
    .eq("job_interviews.outcome", "selected")
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
  jobLocation: { city: string; pincode: string };
  resume: Resume;
  interviews: CompanyInterview[];
  nextRound: number | null;
};

export async function getCompanyApplicant(
  companyId: string,
  ref: string,
): Promise<ApplicantDetail | null> {
  if (!REF.test(ref)) return null;
  const { data, error } = await createAdminClient()
    .from("job_applications")
    .select(`${APPLICANT_COLUMNS}, masked_resume, company_jobs (designation, status, city, pincode)`)
    .eq("company_id", companyId)
    .eq("ref", ref)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as ApplicantRow & {
    masked_resume: Resume;
    company_jobs: { designation: string; status: string; city: string; pincode: string };
  };
  const [names, interviews] = await Promise.all([
    revealedNames([row]),
    listCompanyInterviews(companyId, ref),
  ]);
  const latest = interviews.at(-1);
  return {
    ...toApplicant(row, names),
    designation: row.company_jobs.designation,
    jobClosed: row.company_jobs.status === "closed",
    jobLocation: { city: row.company_jobs.city, pincode: row.company_jobs.pincode },
    resume: row.masked_resume,
    interviews,
    selected: latest?.outcome === OUTCOME_LABELS.selected,
    nextRound:
      row.status !== "active"
        ? null
        : row.stage === 2 && !latest
          ? 1
          : row.stage === 3 &&
              latest?.outcome === OUTCOME_LABELS.next_round &&
              latest.roundNo < MAX_ROUNDS
            ? latest.roundNo + 1
            : null,
  };
}

const INTERVIEW_COLUMNS = `id, starts_at, duration_mins, finished_at, mode, ${PLACE_COLUMNS}, interviewer, round_no, round, outcome, job_applications!inner (ref, job_id, job_title, candidate_id, candidate_no, shortlisted_at)`;

type InterviewRow = InterviewPlaceRow & {
  id: string;
  starts_at: string;
  duration_mins: number;
  finished_at: string | null;
  mode: string;
  interviewer: string;
  round_no: number;
  round: string;
  outcome: InterviewOutcome | null;
  job_applications: Pick<ApplicantRow, "ref" | "job_id" | "candidate_id" | "candidate_no" | "shortlisted_at"> & {
    job_title: string;
  };
};

export async function listCompanyInterviews(
  companyId: string,
  ref?: string,
): Promise<CompanyInterview[]> {
  let query = createAdminClient()
    .from("job_interviews")
    .select(INTERVIEW_COLUMNS)
    .eq("company_id", companyId)
    .is("cancelled_at", null)
    .order("starts_at");
  if (ref) query = query.eq("job_applications.ref", ref);
  const { data, error } = await query;
  if (error) throw error;
  const rows = data as unknown as InterviewRow[];
  const names = await revealedNames(rows.map((r) => r.job_applications));
  return rows.map((r) => {
    const app = r.job_applications;
    return {
      id: r.id,
      applicantRef: app.ref,
      applicant: names.get(app.candidate_id) ?? candidateLabel(app.candidate_no),
      jobId: app.job_id,
      designation: app.job_title,
      startsAt: r.starts_at,
      endsAt: interviewEnd(r.starts_at, r.duration_mins, r.finished_at),
      durationMins: r.duration_mins,
      mode: modeLabel(r.mode),
      ...interviewPlace(r),
      interviewer: r.interviewer,
      roundNo: r.round_no,
      round: r.round,
      outcome: r.outcome ? OUTCOME_LABELS[r.outcome] : null,
    };
  });
}

export async function listSelectedCandidates(companyId: string): Promise<SelectedCandidate[]> {
  const { data, error } = await createAdminClient()
    .from("job_interviews")
    .select(
      "round_no, outcome_at, job_applications!inner (ref, job_id, job_title, candidate_id, candidate_no, shortlisted_at, city, experience_months, status)",
    )
    .eq("company_id", companyId)
    .eq("outcome", "selected")
    .eq("job_applications.status", "active")
    .order("outcome_at", { ascending: false });
  if (error) throw error;
  const rows = data as unknown as {
    round_no: number;
    outcome_at: string;
    job_applications: Pick<
      ApplicantRow,
      "ref" | "job_id" | "candidate_id" | "candidate_no" | "shortlisted_at" | "city" | "experience_months"
    > & { job_title: string };
  }[];
  const names = await revealedNames(rows.map((r) => r.job_applications));
  return rows.map(({ round_no, outcome_at, job_applications: app }) => ({
    ref: app.ref,
    name: names.get(app.candidate_id) ?? candidateLabel(app.candidate_no),
    city: app.city,
    experienceMonths: app.experience_months,
    jobId: app.job_id,
    designation: app.job_title,
    rounds: round_no,
    selectedOn: outcome_at,
  }));
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

// Selected applicants and offers (stage 4) are settled through JobClubb, so
// they can't be rejected here.
export async function rejectApplicant(companyId: string, ref: string) {
  if (!REF.test(ref)) return false;
  const admin = createAdminClient();
  const { count, error: selectedError } = await admin
    .from("job_interviews")
    .select("id, job_applications!inner (ref)", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("job_applications.ref", ref)
    .eq("outcome", "selected");
  if (selectedError) throw selectedError;
  if (count) return false;

  const at = now();
  const { data, error } = await admin
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

const interviewFields = (input: InterviewInput) => ({
  starts_at: input.startsAt,
  duration_mins: input.durationMins,
  finished_at: null,
  mode: input.mode,
  place: input.place,
  address: input.venue?.address ?? null,
  landmark: input.venue?.landmark ?? null,
  city: input.venue?.city ?? null,
  pincode: input.venue?.pincode ?? null,
  interviewer: input.interviewer,
  round: input.round,
});

export async function scheduleInterview(companyId: string, ref: string, input: InterviewInput) {
  if (!REF.test(ref)) return false;
  const admin = createAdminClient();
  const { data: app, error } = await admin
    .from("job_applications")
    .select("id")
    .eq("company_id", companyId)
    .eq("ref", ref)
    .maybeSingle();
  if (error) throw error;
  if (!app) return false;

  const { error: insertError } = await admin
    .from("job_interviews")
    .insert({ ...interviewFields(input), application_id: app.id, company_id: companyId });
  if (!insertError) return true;
  if (insertError.hint === "not_ready_for_interview" || insertError.code === "23505") return false;
  throw insertError;
}

function openInterview(companyId: string, id: string, update: Record<string, unknown>) {
  return createAdminClient()
    .from("job_interviews")
    .update(update)
    .eq("company_id", companyId)
    .eq("id", id)
    .is("cancelled_at", null)
    .is("outcome", null);
}

export async function rescheduleInterview(companyId: string, id: string, input: InterviewInput) {
  if (!UUID.test(id)) return false;
  const { data, error } = await openInterview(companyId, id, interviewFields(input)).select("id");
  if (error) throw error;
  return data.length > 0;
}

export async function cancelInterview(companyId: string, id: string) {
  if (!UUID.test(id)) return false;
  const { data, error } = await openInterview(companyId, id, { cancelled_at: now() }).select("id");
  if (error) throw error;
  return data.length > 0;
}

export async function recordInterviewOutcome(
  companyId: string,
  id: string,
  outcome: InterviewOutcome,
) {
  if (!UUID.test(id) || !(outcome in OUTCOME_LABELS)) return false;
  const at = now();
  const { data, error } = await openInterview(companyId, id, { outcome, outcome_at: at })
    .lte("starts_at", at)
    .select("id");
  if (error?.hint === "interview_not_finished") return false;
  if (error) throw error;
  return data.length > 0;
}

export async function finishInterview(companyId: string, id: string) {
  if (!UUID.test(id)) return false;
  const at = now();
  const { data, error } = await openInterview(companyId, id, { finished_at: at })
    .is("finished_at", null)
    .lte("starts_at", at)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}
