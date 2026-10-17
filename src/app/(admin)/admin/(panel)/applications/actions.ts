"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import type { InterviewFormState } from "@/app/(app)/company/dashboard/applicants/actions";
import { validateInterview, type InterviewOutcome } from "@/lib/interviews";
import { requireAdmin } from "@/server/admin/session";
import {
  sendInterviewCancelled,
  sendInterviewOutcome,
  sendInterviewScheduled,
  sendReferred,
  sendRejected,
} from "@/server/applications/emails";
import {
  cancelScreeningInterview,
  finishScreeningInterview,
  recordScreeningOutcome,
  referToEmployer,
  rejectAtScreening,
  rescheduleScreeningInterview,
  scheduleScreeningInterview,
  shortlistWithoutInterview,
} from "@/server/applications/screening";

type Result = { error?: string };
export type ReferFormState = { error?: string; errors?: { note?: string }; ok?: boolean };

const STALE = "This application has already moved on. Refresh to see the latest.";
const INTERVIEW_STALE = "This interview has already changed. Refresh to see the latest.";

function refresh(ref: string) {
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${ref}`);
  revalidatePath("/admin", "layout");
}

async function attempt(ref: string, label: string, stale: string, run: () => Promise<unknown>): Promise<Result> {
  try {
    if (!(await run())) return { error: stale };
  } catch (error) {
    console.error(`${label} failed`, error);
    return { error: "Something went wrong. Please try again." };
  }
  refresh(ref);
  return {};
}

export async function saveInterview(
  ref: string,
  interviewId: string | null,
  formData: FormData,
): Promise<InterviewFormState> {
  await requireAdmin();
  const { values, errors } = validateInterview(formData, null);
  if (Object.keys(errors).length > 0) return { errors };

  let savedId: string | null = null;
  const result = await attempt(ref, "Saving screening interview", interviewId ? INTERVIEW_STALE : STALE, async () => {
    savedId = interviewId
      ? (await rescheduleScreeningInterview(interviewId, values))
        ? interviewId
        : null
      : await scheduleScreeningInterview(ref, values);
    return savedId;
  });
  if (result.error) return result;
  const id = savedId!;
  after(() => sendInterviewScheduled(null, id, !!interviewId));
  return { ok: true };
}

export async function cancelInterview(ref: string, interviewId: string): Promise<Result> {
  await requireAdmin();
  const result = await attempt(ref, "Cancelling screening interview", INTERVIEW_STALE, () =>
    cancelScreeningInterview(interviewId),
  );
  if (!result.error) after(() => sendInterviewCancelled(null, interviewId));
  return result;
}

export async function finishInterview(ref: string, interviewId: string): Promise<Result> {
  await requireAdmin();
  return attempt(ref, "Finishing screening interview", INTERVIEW_STALE, () =>
    finishScreeningInterview(interviewId),
  );
}

export async function recordOutcome(
  ref: string,
  interviewId: string,
  outcome: InterviewOutcome,
): Promise<Result> {
  await requireAdmin();
  const result = await attempt(ref, "Recording screening outcome", INTERVIEW_STALE, () =>
    recordScreeningOutcome(interviewId, outcome),
  );
  if (!result.error) after(() => sendInterviewOutcome(null, interviewId));
  return result;
}

export async function shortlist(ref: string): Promise<Result> {
  await requireAdmin();
  return attempt(ref, "Shortlisting candidate", STALE, () => shortlistWithoutInterview(ref));
}

export async function reject(ref: string): Promise<Result> {
  await requireAdmin();
  let afterInterview = false;
  const result = await attempt(ref, "Rejecting application", STALE, async () => {
    const rejected = await rejectAtScreening(ref);
    afterInterview = !!rejected?.afterInterview;
    return rejected;
  });
  if (!result.error) after(() => sendRejected(null, ref, afterInterview));
  return result;
}

export async function refer(ref: string, _prev: ReferFormState, formData: FormData): Promise<ReferFormState> {
  await requireAdmin();
  const note = String(formData.get("note") ?? "").trim();
  if (note.length > 2000) return { errors: { note: "Use 2,000 characters or fewer." } };

  let failure: string | undefined;
  const result = await attempt(ref, "Referring candidate", STALE, async () => {
    const referred = await referToEmployer(ref, note);
    if (referred && !referred.ok) failure = referred.error;
    return referred;
  });
  if (failure) return { error: failure };
  if (result.error) return result;
  after(() => sendReferred(ref));
  return { ok: true };
}
