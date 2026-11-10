"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import type { AdminFormState } from "@/app/(admin)/admin/(panel)/placements/actions";
import {
  validateExtension,
  validateFranchiseDetails,
  validateFranchiseProfile,
  validateFranchiseTerms,
  validatePayout,
  validateReversal,
  validateTermination,
} from "@/lib/franchise";
import { requireAdmin } from "@/server/admin/session";
import { sendFranchiseReviewedEmail, sendPayoutEmail } from "@/server/franchises/emails";
import {
  approveFranchise,
  createFranchise,
  extendFranchise,
  getFranchise,
  isApproved,
  rejectFranchise,
  terminateFranchise,
  updateFranchise,
} from "@/server/franchises/franchises";
import { createPayout, reverseCommission } from "@/server/franchises/ledger";

const FAILED = "Something went wrong. Please try again.";
const MISSING = "This franchise no longer exists. Refresh to see the latest.";

function refresh(id?: string) {
  revalidatePath("/admin", "layout");
  revalidatePath("/franchise/dashboard", "layout");
  if (id) revalidatePath(`/admin/franchises/${id}`);
}

export async function createFranchiseAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const { values, errors } = validateFranchiseDetails(formData, { creating: true });
  if (Object.keys(errors).length > 0) return { errors };

  let id: string;
  try {
    const result = await createFranchise(values);
    if (!result.ok) return { errors: result.errors };
    id = result.id;
  } catch (error) {
    console.error("Creating franchise failed", error);
    return { error: FAILED };
  }
  refresh();
  redirect(`/admin/franchises/${id}?created=1`);
}

export async function updateFranchiseAction(
  id: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  try {
    const franchise = await getFranchise(id);
    if (!franchise) return { error: MISSING };
    // Terms only exist once a franchise is approved.
    const profile = validateFranchiseProfile(formData);
    const terms = franchise.status === "approved" ? validateFranchiseTerms(formData) : null;
    const errors = { ...profile.errors, ...terms?.errors };
    if (Object.keys(errors).length > 0) return { errors };
    if (!(await updateFranchise(id, profile.values, terms?.values ?? null))) return { error: MISSING };
  } catch (error) {
    console.error("Updating franchise failed", error);
    return { error: FAILED };
  }
  refresh(id);
  return { ok: true };
}

export async function terminateFranchiseAction(
  id: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  try {
    const franchise = await getFranchise(id);
    if (!franchise || !isApproved(franchise)) return { error: MISSING };
    const { values, errors } = validateTermination(formData, franchise);
    if (Object.keys(errors).length > 0) return { errors };
    if (!(await terminateFranchise(id, values.terminatedOn, values.note))) return { error: MISSING };
  } catch (error) {
    console.error("Terminating franchise failed", error);
    return { error: FAILED };
  }
  refresh(id);
  return { ok: true };
}

export async function extendFranchiseAction(
  id: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  try {
    const franchise = await getFranchise(id);
    if (!franchise || !isApproved(franchise)) return { error: MISSING };
    const { endsOn, errors } = validateExtension(formData, franchise);
    if (Object.keys(errors).length > 0) return { errors };
    if (!(await extendFranchise(id, endsOn))) return { error: MISSING };
  } catch (error) {
    console.error("Extending franchise failed", error);
    return { error: FAILED };
  }
  refresh(id);
  return { ok: true };
}

export async function reverseCommissionAction(
  franchiseId: string,
  commissionId: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const { reason, error } = validateReversal(formData);
  if (error) return { errors: { reason: error } };

  try {
    const outcome = await reverseCommission(commissionId, reason);
    if (outcome === "missing") return { error: "This commission no longer exists. Refresh to see the latest." };
    if (outcome === "already") return { error: "This commission has already been reversed. Refresh to see the latest." };
  } catch (error) {
    console.error("Reversing franchise commission failed", error);
    return { error: FAILED };
  }
  refresh(franchiseId);
  return { ok: true };
}

const PAYOUT_ERRORS = {
  nothing_to_pay: "There's nothing outstanding to pay. Refresh to see the latest.",
  outstanding_changed:
    "The outstanding amount changed while you had this open. Check the new total before recording the transfer.",
  franchise_missing: MISSING,
};

export async function createPayoutAction(
  franchiseId: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const { values, errors } = validatePayout(formData);
  if (!Number.isInteger(values.expected) || values.expected <= 0)
    return { error: PAYOUT_ERRORS.outstanding_changed };
  if (Object.keys(errors).length > 0) return { errors };

  let payoutId: string;
  try {
    const result = await createPayout(franchiseId, values);
    if (!result.ok) {
      if (result.error === "outstanding_changed") refresh(franchiseId);
      return { error: PAYOUT_ERRORS[result.error] };
    }
    payoutId = result.payout.id;
  } catch (error) {
    console.error("Recording franchise payout failed", error);
    return { error: FAILED };
  }
  refresh(franchiseId);
  after(() => sendPayoutEmail(payoutId));
  return { ok: true };
}

export async function approveFranchiseAction(
  id: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const { values, errors } = validateFranchiseTerms(formData);
  if (formData.get("agreementSigned") !== "yes")
    errors.agreementSigned = "Approve only once the franchise agreement is signed.";
  else if (formData.get("feeReceived") !== "yes")
    errors.feeReceived = "Approve only once the franchise fee is received.";
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2) errors.name = "Enter the franchise name.";
  else if (name.length > 80) errors.name = "Use 80 characters or fewer.";
  if (Object.keys(errors).length > 0) return { errors };

  try {
    const outcome = await approveFranchise(id, { ...values, name });
    if (outcome === "missing") return { error: MISSING };
    if (outcome === "stale") return { error: "This franchise has already been approved. Refresh to see the latest." };
  } catch (error) {
    console.error("Approving franchise failed", error);
    return { error: FAILED };
  }
  refresh(id);
  after(() => sendFranchiseReviewedEmail(id));
  return { ok: true };
}

export async function rejectFranchiseAction(
  id: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const note = String(formData.get("note") ?? "").trim();
  if (note.length < 3) return { errors: { note: "Tell them why, so they understand the decision." } };
  if (note.length > 500) return { errors: { note: "Use 500 characters or fewer." } };

  try {
    if ((await rejectFranchise(id, note)) === "stale")
      return { error: "This sign-up has already been reviewed. Refresh to see the latest." };
  } catch (error) {
    console.error("Rejecting franchise failed", error);
    return { error: FAILED };
  }
  refresh(id);
  after(() => sendFranchiseReviewedEmail(id));
  return { ok: true };
}
