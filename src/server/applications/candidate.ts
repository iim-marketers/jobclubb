import "server-only";

import { randomInt } from "node:crypto";

import {
  GUARANTEED_INTERVIEWS,
  formatInterviewDate,
  formatInterviewTime,
  formatShortDate,
  type Application,
  type Interview,
} from "@/lib/candidate-activity";
import {
  OUTCOME_LABELS,
  PLACE_COLUMNS,
  interviewEnd,
  interviewPlace,
  modeLabel,
  type InterviewOutcome,
  type InterviewPlaceRow,
} from "@/lib/interviews";
import {
  deadlineEnd,
  formatDateOnly,
  formatRupees,
  isReleased,
  type PlacementStatus,
} from "@/lib/placements";
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
import { hasAcceptedCurrentTerms } from "@/server/auth/terms";
import { getCompanyLogoUrl } from "@/server/companies/logo";
import { postedAgo, toListing } from "@/server/jobs/listings";
import { effectiveStatus } from "@/server/placements/placements";

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
  | { ok: true; ref: string; created: boolean }
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
    if (!error) return { ok: true, ref: data.ref as string, created: true };

    if (error.hint === "job_not_live") return { ok: false, reason: "job_not_live" };
    if (error.code === "23505" && error.message.includes("job_applications_job_candidate_key")) {
      const existing = await findApplicationRef(candidate.id, jobResult.data.id);
      if (existing) return { ok: true, ref: existing, created: false };
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
  | { kind: "ready"; needsTerms: boolean }
  | { kind: "no-resume" }
  | { kind: "applied"; ref: string };

export async function getApplyState(candidateId: string, slug: string): Promise<ApplyState> {
  const admin = createAdminClient();
  const [application, resume, termsAccepted] = await Promise.all([
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
    hasAcceptedCurrentTerms("candidates", candidateId),
  ]);
  if (application.error) throw application.error;
  if (resume.error) throw resume.error;

  if (application.data) return { kind: "applied", ref: application.data.ref as string };
  return resume.count ? { kind: "ready", needsTerms: !termsAccepted } : { kind: "no-resume" };
}

const PLACEMENT_COLUMNS =
  "id, status, fee_amount, offer_deadline, joining_date, monthly_salary, offer_notes, released_at, accepted_at, closed_at";

const APPLICATION_COLUMNS = `ref, stage, status, created_at, viewed_at, shortlisted_at, rejected_at, company_jobs (${PUBLIC_JOB_COLUMNS}), job_interviews (created_at, round_no, starts_at, duration_mins, finished_at, cancelled_at, outcome, outcome_at), placements (${PLACEMENT_COLUMNS})`;

type PlacementEmbed = {
  id: string;
  status: PlacementStatus;
  fee_amount: number | null;
  offer_deadline: string | null;
  joining_date: string | null;
  monthly_salary: number | null;
  offer_notes: string | null;
  released_at: string | null;
  accepted_at: string | null;
  closed_at: string | null;
};

// A one-to-one embed comes back as an object, but tolerate the array form.
const onePlacement = (embed: PlacementEmbed | PlacementEmbed[] | null | undefined) =>
  (Array.isArray(embed) ? embed[0] : embed) ?? null;

// The candidate learns they were selected only when JobClubb releases the
// offer, so until then a "selected" outcome reads as a pending result, and an
// offer withdrawn before release reads as not selected.
function hideSelection<T extends { outcome: InterviewOutcome | null; outcome_at?: string | null }>(
  interview: T,
  placement: PlacementEmbed | null,
): T {
  if (interview.outcome !== "selected" || placement?.released_at) return interview;
  return placement?.status === "withdrawn"
    ? { ...interview, outcome: "not_selected" }
    : { ...interview, outcome: null, outcome_at: null };
}

function toOffer(placement: PlacementEmbed | null): Application["offer"] {
  if (!placement?.released_at || !isReleased(placement.status)) return null;
  if (!placement.fee_amount || !placement.offer_deadline || !placement.joining_date) return null;
  const status = effectiveStatus(placement);
  if (status === "awaiting_offer" || status === "offer_received") return null;
  const unlocked = status === "accepted" || status === "joined" || status === "not_joined";
  return {
    placementId: placement.id,
    status,
    fee: placement.fee_amount,
    paid: placement.accepted_at !== null,
    deadline: placement.offer_deadline,
    joiningDate: placement.joining_date,
    monthlySalary: unlocked ? placement.monthly_salary : null,
    notes: unlocked ? (placement.offer_notes ?? "") : "",
  };
}

type ApplicationInterviewRow = {
  created_at: string;
  round_no: number;
  starts_at: string;
  duration_mins: number;
  finished_at: string | null;
  cancelled_at: string | null;
  outcome: InterviewOutcome | null;
  outcome_at: string | null;
};

type ApplicationRow = {
  ref: string;
  stage: number;
  status: "active" | "rejected";
  created_at: string;
  viewed_at: string | null;
  shortlisted_at: string | null;
  rejected_at: string | null;
  company_jobs: PublicJobRow;
  job_interviews: ApplicationInterviewRow[];
  placements: PlacementEmbed | PlacementEmbed[] | null;
};

const CLOSED_OFFER_EVENTS = {
  joined: "Joined",
  not_joined: "Did not join",
  expired: "Offer expired",
  declined: "Offer declined",
  withdrawn: "Offer withdrawn",
};

function offerUpdate(offer: NonNullable<Application["offer"]>) {
  switch (offer.status) {
    case "released":
      return `Congratulations, you've been selected! Pay the placement fee of ${formatRupees(offer.fee)} by ${formatDateOnly(offer.deadline)} to unlock your offer letter.`;
    case "accepted":
      return `Your offer letter is unlocked. You're expected to join on ${formatDateOnly(offer.joiningDate)}.`;
    case "joined":
      return "Congratulations on your new role! The employer has confirmed you joined.";
    case "not_joined":
      return "The employer recorded that you didn't join on the agreed date. Contact our placement team if that's wrong.";
    case "expired":
      return "The deadline to claim this offer passed, so it lapsed. Contact our placement team if you still want the role.";
    case "declined":
      return "You declined this offer. New roles are added every day, so keep applying.";
    case "withdrawn":
      return "The employer withdrew this offer. Our placement team will be in touch.";
  }
}

function latestUpdate(
  a: Application,
  row: ApplicationRow,
  interview: ApplicationInterviewRow | undefined,
) {
  if (a.status === "rejected")
    return "The employer has decided not to move forward with this application. New roles are added every day, so keep applying.";
  if (a.status === "closed")
    return "This posting has closed and the employer is no longer reviewing applications for it.";
  if (a.offer) return offerUpdate(a.offer);
  if (interview?.outcome === "next_round")
    return `You cleared round ${interview.round_no}. The employer will schedule your next round, and it'll show up here.`;
  const yours = interview && interview.round_no > 1 ? `Your round ${interview.round_no} interview` : "Your interview";
  if (interview && Date.parse(interview.starts_at) > Date.now())
    return `${yours} is on ${formatInterviewDate(interview.starts_at)} at ${formatInterviewTime(interview.starts_at)}. The details are on your Interviews page.`;
  if (
    interview &&
    Date.parse(interviewEnd(interview.starts_at, interview.duration_mins, interview.finished_at)) >
      Date.now()
  )
    return `${yours} is happening now. Join from your Interviews page.`;
  if (interview) return `${yours} is done. The employer will share the result soon.`;
  if (row.job_interviews.length > 0)
    return "The employer cancelled your interview. If they set a new time, it'll show up here.";
  if (row.stage >= 2)
    return "You've been shortlisted. The employer can now see your name; your phone number and email stay private.";
  if (row.stage === 1) return "The employer has opened your profile.";
  return "Your application has been delivered to the employer.";
}

function toApplication(row: ApplicationRow): Application {
  const job = toPublicJob(row.company_jobs);
  const placement = onePlacement(row.placements);
  const offer = toOffer(placement);
  const interviews = row.job_interviews
    .map((i) => hideSelection(i, placement))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const rounds = interviews.filter((i) => !i.cancelled_at);
  const interview = rounds.at(-1);
  const events = [
    { label: "Applied", at: row.created_at },
    row.viewed_at && { label: "Viewed by employer", at: row.viewed_at },
    row.shortlisted_at && { label: "Shortlisted", at: row.shortlisted_at },
    ...interviews.flatMap((i) => [
      { label: `Round ${i.round_no} interview scheduled`, at: i.created_at },
      i.cancelled_at && { label: `Round ${i.round_no} interview cancelled`, at: i.cancelled_at },
      i.outcome === "next_round" && i.outcome_at && { label: `Cleared round ${i.round_no}`, at: i.outcome_at },
    ]),
    offer && placement?.released_at && { label: "Selected", at: placement.released_at },
    offer && placement?.accepted_at && { label: "Offer accepted", at: placement.accepted_at },
    offer && offer.status !== "released" && offer.status !== "accepted" && {
      label: CLOSED_OFFER_EVENTS[offer.status],
      at: placement?.closed_at ?? deadlineEnd(offer.deadline).toISOString(),
    },
    row.rejected_at && { label: "Not selected", at: row.rejected_at },
  ]
    .filter((e): e is { label: string; at: string } => !!e)
    .sort((a, b) => a.at.localeCompare(b.at));

  const application: Application = {
    id: row.ref,
    job: toListing(job),
    stage: row.stage,
    status:
      row.status === "rejected"
        ? "rejected"
        : job.status === "closed" && row.stage < 3
          ? "closed"
          : "active",
    offer,
    jobClosed: job.status === "closed",
    appliedOn: row.created_at,
    stageDates: [
      row.created_at,
      row.viewed_at,
      row.shortlisted_at,
      rounds[0]?.created_at ?? null,
      offer ? placement!.released_at : null,
    ].map((at) => (at ? formatShortDate(at) : null)),
    updatedAgo: postedAgo(events[events.length - 1].at),
    update: "",
    history: events.map((e) => ({ label: e.label, date: formatShortDate(e.at) })),
  };
  application.update = latestUpdate(application, row, interview);
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

type CandidateInterviewRow = InterviewPlaceRow & {
  id: string;
  starts_at: string;
  duration_mins: number;
  finished_at: string | null;
  mode: string;
  interviewer: string;
  round_no: number;
  round: string;
  outcome: InterviewOutcome | null;
  job_applications: {
    ref: string;
    company_name: string;
    job_title: string;
    companies: { logo_path: string | null } | null;
    placements: PlacementEmbed | PlacementEmbed[] | null;
  };
};

export async function listCandidateInterviews(candidateId: string): Promise<Interview[]> {
  const { data, error } = await createAdminClient()
    .from("job_interviews")
    .select(
      `id, starts_at, duration_mins, finished_at, mode, ${PLACE_COLUMNS}, interviewer, round_no, round, outcome, job_applications (ref, company_name, job_title, companies (logo_path), placements (${PLACEMENT_COLUMNS}))`,
    )
    .eq("candidate_id", candidateId)
    .is("cancelled_at", null)
    .order("created_at");
  if (error) throw error;
  const now = Date.now();
  let firstRounds = 0;
  return (data as unknown as CandidateInterviewRow[]).map((row) => {
    const r = hideSelection(row, onePlacement(row.job_applications.placements));
    const endsAt = interviewEnd(r.starts_at, r.duration_mins, r.finished_at);
    return {
      id: r.id,
      company: r.job_applications.company_name,
      companyLogoUrl: getCompanyLogoUrl(r.job_applications.companies?.logo_path ?? null),
      role: r.job_applications.job_title,
      applicationId: r.job_applications.ref,
      startsAt: r.starts_at,
      endsAt,
      durationMins: r.duration_mins,
      mode: modeLabel(r.mode),
      // A retired phone interview's place is the employer's number.
      ...(r.mode === "phone" ? { place: "", venue: null } : interviewPlace(r)),
      interviewer: r.interviewer,
      roundNo: r.round_no,
      round: r.round,
      guaranteed: r.round_no === 1 && firstRounds++ < GUARANTEED_INTERVIEWS,
      outcome: r.outcome
        ? OUTCOME_LABELS[r.outcome]
        : Date.parse(endsAt) <= now
          ? "Awaiting result"
          : undefined,
    };
  });
}
