import "server-only";

import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { COMPANY_HOME } from "@/components/company/nav";
import { formatExperienceMonths } from "@/lib/company-activity";
import { sendEmail } from "@/lib/email/mailer";
import { applicationDeclinedEmail } from "@/lib/email/templates/application-declined";
import { applicationSubmittedEmail } from "@/lib/email/templates/application-submitted";
import { candidateReferralEmail } from "@/lib/email/templates/candidate-referral";
import { candidateReferredEmail } from "@/lib/email/templates/candidate-referred";
import { candidateSelectedEmail } from "@/lib/email/templates/candidate-selected";
import { PLACEMENT_EMAIL } from "@/lib/placements";
import { interviewCancelledEmail } from "@/lib/email/templates/interview-cancelled";
import {
  interviewScheduledEmail,
  type InterviewEmailKind,
} from "@/lib/email/templates/interview-scheduled";
import {
  PLACE_COLUMNS,
  formatIst,
  interviewPlace,
  type InterviewModeValue,
  type InterviewOutcome,
  type InterviewPlaceRow,
} from "@/lib/interviews";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/server";

type Candidate = { first_name: string; last_name: string; email: string; phone: string };

const formatDate = (iso: string) =>
  formatIst(iso, { day: "numeric", month: "short", year: "numeric" });

// Called from after(), so failures are logged rather than surfaced to the user.
async function send(kind: string, build: () => Promise<Parameters<typeof sendEmail>[0] | null>) {
  try {
    const message = await build();
    if (message) await sendEmail(message);
  } catch (error) {
    console.error(`Sending ${kind} email failed`, error);
  }
}

export function sendApplicationSubmitted(ref: string) {
  return send("application submitted", async () => {
    const { data, error } = await createAdminClient()
      .from("job_applications")
      .select("ref, job_title, company_name, created_at, candidates (first_name, email)")
      .eq("ref", ref)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const candidate = data.candidates as unknown as Pick<Candidate, "first_name" | "email">;
    return {
      to: candidate.email,
      ...applicationSubmittedEmail({
        firstName: candidate.first_name,
        email: candidate.email,
        companyName: data.company_name,
        jobTitle: data.job_title,
        applicationRef: data.ref,
        appliedOn: formatDate(data.created_at),
        applicationUrl: `${SITE_URL}${CANDIDATE_HOME}/applications/${data.ref}`,
      }),
    };
  });
}

// companyId is null when JobClubb acts, which may be on any application.
async function applicationWithCandidate(companyId: string | null, ref: string) {
  let query = createAdminClient()
    .from("job_applications")
    .select(
      "ref, stage, job_title, company_name, city, experience_months, referral_note, candidates (first_name, last_name, email, phone), companies (email, contact_name)",
    )
    .eq("ref", ref);
  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    candidate: data.candidates as unknown as Candidate,
    company: data.companies as unknown as { email: string; contact_name: string },
  };
}

// Each email fails independently.
export function sendReferred(ref: string) {
  const application = applicationWithCandidate(null, ref);
  return Promise.all([
    send("candidate referral", async () => {
      const app = await application;
      if (!app) return null;
      return {
        to: app.company.email,
        ...candidateReferralEmail({
          contactName: app.company.contact_name,
          companyName: app.company_name,
          email: app.company.email,
          jobTitle: app.job_title,
          candidateName: `${app.candidate.first_name} ${app.candidate.last_name}`,
          experience: formatExperienceMonths(app.experience_months),
          city: app.city,
          note: app.referral_note ?? "",
          reviewUrl: `${SITE_URL}${COMPANY_HOME}/applicants/${app.ref}`,
        }),
      };
    }),
    send("candidate referred", async () => {
      const app = await application;
      if (!app) return null;
      return {
        to: app.candidate.email,
        ...candidateReferredEmail({
          firstName: app.candidate.first_name,
          email: app.candidate.email,
          companyName: app.company_name,
          jobTitle: app.job_title,
          applicationRef: app.ref,
          applicationUrl: `${SITE_URL}${CANDIDATE_HOME}/applications/${app.ref}`,
        }),
      };
    }),
  ]);
}

export function sendRejected(companyId: string | null, ref: string, afterInterview?: boolean) {
  return send("application declined", async () => {
    const app = await applicationWithCandidate(companyId, ref);
    if (!app) return null;
    return {
      to: app.candidate.email,
      ...applicationDeclinedEmail({
        firstName: app.candidate.first_name,
        email: app.candidate.email,
        companyName: app.company_name,
        jobTitle: app.job_title,
        afterInterview: afterInterview ?? app.stage >= 3,
      }),
    };
  });
}

type InterviewRow = InterviewPlaceRow & {
  host: "company" | "jobclubb";
  starts_at: string;
  duration_mins: number;
  mode: InterviewModeValue | "phone";
  interviewer: string;
  round_no: number;
  round: string;
  outcome: InterviewOutcome | null;
  outcome_at: string | null;
  job_title: string;
  company_name: string;
  candidates: Candidate;
  job_applications: {
    ref: string;
    company_jobs: { city: string };
    placements: { id: string } | { id: string }[] | null;
  };
  companies: { contact_name: string; designation: string; email: string; phone: string };
};

async function getInterview(companyId: string | null, id: string) {
  let query = createAdminClient()
    .from("job_interviews")
    .select(
      `host, starts_at, duration_mins, mode, ${PLACE_COLUMNS}, interviewer, round_no, round, outcome, outcome_at, job_title, company_name, candidates (first_name, last_name, email, phone), job_applications (ref, company_jobs (city), placements (id)), companies (contact_name, designation, email, phone)`,
    )
    .eq("id", id);
  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as unknown as InterviewRow | null;
}

async function interviewEmail(companyId: string | null, id: string, kind: InterviewEmailKind) {
  const interview = await getInterview(companyId, id);
  // A retired phone interview's place is the employer's number.
  if (!interview || interview.mode === "phone") return null;
  const { candidates: candidate } = interview;
  return {
    to: candidate.email,
    ...interviewScheduledEmail({
      firstName: candidate.first_name,
      email: candidate.email,
      companyName: interview.company_name,
      jobTitle: interview.job_title,
      roundNo: interview.round_no,
      round: interview.round,
      startsAt: interview.starts_at,
      durationMins: interview.duration_mins,
      mode: interview.mode,
      ...interviewPlace(interview),
      interviewer: interview.interviewer,
      interviewsUrl: `${SITE_URL}${CANDIDATE_HOME}/interviews`,
      kind,
      jobclubb: interview.host === "jobclubb",
    }),
  };
}

export function sendInterviewScheduled(companyId: string | null, id: string, rescheduled: boolean) {
  return send("interview scheduled", () =>
    interviewEmail(companyId, id, rescheduled ? "rescheduled" : "scheduled"),
  );
}

// Throws, unlike the senders above, so the reminder job can release the claim
// and retry on its next run.
export async function sendInterviewReminder(id: string) {
  const message = await interviewEmail(null, id, "reminder");
  if (message) await sendEmail(message);
}

export function sendInterviewCancelled(companyId: string | null, id: string) {
  return send("interview cancelled", async () => {
    const interview = await getInterview(companyId, id);
    if (!interview) return null;
    const { candidates: candidate } = interview;
    return {
      to: candidate.email,
      ...interviewCancelledEmail({
        firstName: candidate.first_name,
        email: candidate.email,
        companyName: interview.company_name,
        jobTitle: interview.job_title,
        roundNo: interview.round_no,
        round: interview.round,
        startsAt: interview.starts_at,
        applicationUrl: `${SITE_URL}${CANDIDATE_HOME}/applications/${interview.job_applications.ref}`,
        jobclubb: interview.host === "jobclubb",
      }),
    };
  });
}

const placementPath = (embed: { id: string } | { id: string }[] | null) => {
  const placement = Array.isArray(embed) ? embed[0] : embed;
  return placement ? `/${placement.id}` : "";
};

export function sendInterviewOutcome(companyId: string | null, id: string) {
  return send("interview outcome", async () => {
    const interview = await getInterview(companyId, id);
    if (!interview) return null;
    const { candidates: candidate, companies: company } = interview;

    if (interview.outcome === "not_selected")
      return {
        to: candidate.email,
        ...applicationDeclinedEmail({
          firstName: candidate.first_name,
          email: candidate.email,
          companyName: interview.company_name,
          jobTitle: interview.job_title,
          afterInterview: true,
        }),
      };

    if (interview.outcome === "selected")
      return {
        to: PLACEMENT_EMAIL,
        ...candidateSelectedEmail({
          candidate: {
            name: `${candidate.first_name} ${candidate.last_name}`,
            email: candidate.email,
            phone: candidate.phone,
          },
          company: {
            name: interview.company_name,
            contactName: company.contact_name,
            designation: company.designation,
            email: company.email,
            phone: company.phone,
          },
          jobTitle: interview.job_title,
          jobCity: interview.job_applications.company_jobs.city,
          applicationRef: interview.job_applications.ref,
          rounds: interview.round_no,
          selectedOn: formatDate(interview.outcome_at!),
          adminUrl: `${SITE_URL}/admin/placements${placementPath(interview.job_applications.placements)}`,
        }),
      };

    return null;
  });
}
