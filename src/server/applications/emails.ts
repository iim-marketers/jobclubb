import "server-only";

import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { COMPANY_HOME } from "@/components/company/nav";
import { candidateLabel, formatExperienceMonths } from "@/lib/company-activity";
import { sendEmail } from "@/lib/email/mailer";
import { applicationDeclinedEmail } from "@/lib/email/templates/application-declined";
import { applicationReceivedEmail } from "@/lib/email/templates/application-received";
import { candidateSelectedEmail } from "@/lib/email/templates/candidate-selected";
import { candidateShortlistedEmail } from "@/lib/email/templates/candidate-shortlisted";
import { interviewCancelledEmail } from "@/lib/email/templates/interview-cancelled";
import { interviewScheduledEmail } from "@/lib/email/templates/interview-scheduled";
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

const PLACEMENT_EMAIL = "placement@jobclubb.com";

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

export function sendApplicationReceived(ref: string) {
  return send("application received", async () => {
    const { data, error } = await createAdminClient()
      .from("job_applications")
      .select(
        "ref, job_title, company_name, candidate_no, city, experience_months, created_at, companies (email, contact_name)",
      )
      .eq("ref", ref)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const company = data.companies as unknown as { email: string; contact_name: string };
    return {
      to: company.email,
      ...applicationReceivedEmail({
        contactName: company.contact_name,
        companyName: data.company_name,
        email: company.email,
        jobTitle: data.job_title,
        candidateLabel: candidateLabel(data.candidate_no),
        experience: formatExperienceMonths(data.experience_months),
        city: data.city,
        appliedOn: formatDate(data.created_at),
        reviewUrl: `${SITE_URL}${COMPANY_HOME}/applicants/${data.ref}`,
      }),
    };
  });
}

async function applicationWithCandidate(companyId: string, ref: string) {
  const { data, error } = await createAdminClient()
    .from("job_applications")
    .select("ref, stage, job_title, company_name, candidates (first_name, last_name, email, phone)")
    .eq("company_id", companyId)
    .eq("ref", ref)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, candidate: data.candidates as unknown as Candidate };
}

export function sendShortlisted(companyId: string, ref: string) {
  return send("shortlisted", async () => {
    const app = await applicationWithCandidate(companyId, ref);
    if (!app) return null;
    return {
      to: app.candidate.email,
      ...candidateShortlistedEmail({
        firstName: app.candidate.first_name,
        email: app.candidate.email,
        companyName: app.company_name,
        jobTitle: app.job_title,
        applicationRef: app.ref,
        applicationUrl: `${SITE_URL}${CANDIDATE_HOME}/applications/${app.ref}`,
      }),
    };
  });
}

export function sendRejected(companyId: string, ref: string) {
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
        afterInterview: app.stage >= 3,
      }),
    };
  });
}

type InterviewRow = InterviewPlaceRow & {
  starts_at: string;
  duration_mins: number;
  mode: InterviewModeValue;
  interviewer: string;
  round_no: number;
  round: string;
  outcome: InterviewOutcome | null;
  outcome_at: string | null;
  job_title: string;
  company_name: string;
  candidates: Candidate;
  job_applications: { ref: string; company_jobs: { city: string } };
  companies: { contact_name: string; designation: string; email: string; phone: string };
};

async function getInterview(companyId: string, id: string) {
  const { data, error } = await createAdminClient()
    .from("job_interviews")
    .select(
      `starts_at, duration_mins, mode, ${PLACE_COLUMNS}, interviewer, round_no, round, outcome, outcome_at, job_title, company_name, candidates (first_name, last_name, email, phone), job_applications (ref, company_jobs (city)), companies (contact_name, designation, email, phone)`,
    )
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as InterviewRow | null;
}

export function sendInterviewScheduled(companyId: string, id: string, rescheduled: boolean) {
  return send("interview scheduled", async () => {
    const interview = await getInterview(companyId, id);
    if (!interview) return null;
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
        rescheduled,
      }),
    };
  });
}

export function sendInterviewCancelled(companyId: string, id: string) {
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
      }),
    };
  });
}

export function sendInterviewOutcome(companyId: string, id: string) {
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
        }),
      };

    return null;
  });
}
