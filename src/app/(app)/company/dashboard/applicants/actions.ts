"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { COMPANY_HOME } from "@/components/company/nav";
import { validateInterview, type InterviewOutcome } from "@/lib/interviews";
import type { FieldErrors } from "@/lib/sign-up-validation";
import { requireCompany } from "@/server/auth/current-company";
import {
  cancelInterview as cancelCompanyInterview,
  finishInterview as finishCompanyInterview,
  recordInterviewOutcome,
  rejectApplicant,
  rescheduleInterview,
  scheduleInterview,
} from "@/server/applications/company";
import {
  sendInterviewCancelled,
  sendInterviewOutcome,
  sendInterviewScheduled,
  sendRejected,
} from "@/server/applications/emails";

const STALE = "This applicant has already moved on. Refresh to see the latest.";

export async function reject(ref: string): Promise<{ error?: string }> {
  const company = await requireCompany(`${COMPANY_HOME}/applicants/${ref}`);
  try {
    if (!(await rejectApplicant(company.id, ref))) return { error: STALE };
  } catch (error) {
    console.error("Rejecting applicant failed", error);
    return { error: "We couldn't update this applicant. Please try again." };
  }
  after(() => sendRejected(company.id, ref));
  revalidatePath("/company", "layout");
  return {};
}

export type InterviewFormState = { errors?: FieldErrors; error?: string; ok?: boolean };

const INTERVIEW_STALE = "This interview has already changed. Refresh to see the latest.";

export async function saveInterview(
  ref: string,
  interviewId: string | null,
  formData: FormData,
): Promise<InterviewFormState> {
  const company = await requireCompany(`${COMPANY_HOME}/applicants/${ref}`);
  const { values, errors } = validateInterview(formData, company);
  if (Object.keys(errors).length > 0) return { errors };

  try {
    const savedId = interviewId
      ? (await rescheduleInterview(company.id, interviewId, values)) && interviewId
      : await scheduleInterview(company.id, ref, values);
    if (!savedId) return { error: interviewId ? INTERVIEW_STALE : STALE };
    after(() => sendInterviewScheduled(company.id, savedId, !!interviewId));
  } catch (error) {
    console.error("Saving interview failed", error);
    return { error: "We couldn't save this interview. Please try again." };
  }
  revalidatePath("/company", "layout");
  return { ok: true };
}

export async function cancelInterview(ref: string, interviewId: string): Promise<{ error?: string }> {
  const company = await requireCompany(`${COMPANY_HOME}/applicants/${ref}`);
  try {
    if (!(await cancelCompanyInterview(company.id, interviewId))) return { error: INTERVIEW_STALE };
  } catch (error) {
    console.error("Cancelling interview failed", error);
    return { error: "We couldn't cancel this interview. Please try again." };
  }
  after(() => sendInterviewCancelled(company.id, interviewId));
  revalidatePath("/company", "layout");
  return {};
}

export async function recordOutcome(
  ref: string,
  interviewId: string,
  outcome: InterviewOutcome,
): Promise<{ error?: string }> {
  const company = await requireCompany(`${COMPANY_HOME}/applicants/${ref}`);
  try {
    if (!(await recordInterviewOutcome(company.id, interviewId, outcome)))
      return { error: INTERVIEW_STALE };
  } catch (error) {
    console.error("Recording interview outcome failed", error);
    return { error: "We couldn't save the result. Please try again." };
  }
  after(() => sendInterviewOutcome(company.id, interviewId));
  revalidatePath("/company", "layout");
  return {};
}

export async function finishInterview(ref: string, interviewId: string): Promise<{ error?: string }> {
  const company = await requireCompany(`${COMPANY_HOME}/applicants/${ref}`);
  try {
    if (!(await finishCompanyInterview(company.id, interviewId))) return { error: INTERVIEW_STALE };
  } catch (error) {
    console.error("Finishing interview failed", error);
    return { error: "We couldn't update this interview. Please try again." };
  }
  revalidatePath("/company", "layout");
  return {};
}
