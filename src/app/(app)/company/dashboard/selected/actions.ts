"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { COMPANY_SELECTED } from "@/components/company/nav";
import { validateLeaving, validateOfferTerms } from "@/lib/placements";
import type { FieldErrors } from "@/lib/sign-up-validation";
import { requireCompany } from "@/server/auth/current-company";
import { offerFiles } from "@/server/placements/documents";
import {
  sendLeavingReported,
  sendOfferUploaded,
  sendPlacementWithdrawn,
} from "@/server/placements/emails";
import {
  recordJoining,
  reportLeaving,
  submitCompanyOffer,
  withdrawPlacement,
} from "@/server/placements/placements";

export type OfferFormState = { errors?: FieldErrors; error?: string; ok?: boolean };

const STALE = "This placement has already changed. Refresh to see the latest.";

export async function submitOffer(
  placementId: string,
  _prev: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const company = await requireCompany(COMPANY_SELECTED);
  const { values, errors } = validateOfferTerms(formData);
  if (Object.keys(errors).length > 0) return { errors };

  let result: Awaited<ReturnType<typeof submitCompanyOffer>>;
  try {
    result = await submitCompanyOffer(company.id, placementId, values, offerFiles(formData));
  } catch (error) {
    console.error("Submitting offer failed", error);
    return { error: "We couldn't upload the offer. Please try again." };
  }
  if (!result.ok)
    return result.field ? { errors: { documents: result.error } } : { error: result.error };

  const { firstSubmission } = result;
  after(() => sendOfferUploaded(placementId, firstSubmission));
  revalidatePath("/company", "layout");
  return { ok: true };
}

export async function withdrawOffer(placementId: string): Promise<{ error?: string }> {
  const company = await requireCompany(COMPANY_SELECTED);
  let result: Awaited<ReturnType<typeof withdrawPlacement>>;
  try {
    result = await withdrawPlacement(placementId, { companyId: company.id });
  } catch (error) {
    console.error("Withdrawing offer failed", error);
    return { error: "We couldn't withdraw the offer. Please try again." };
  }
  if (!result) return { error: STALE };
  const { candidateWasTold } = result;
  after(() => sendPlacementWithdrawn(placementId, candidateWasTold, true));
  revalidatePath("/company", "layout");
  return {};
}

export async function confirmJoining(
  placementId: string,
  joined: boolean,
): Promise<{ error?: string }> {
  const company = await requireCompany(COMPANY_SELECTED);
  try {
    if (!(await recordJoining(placementId, joined, { companyId: company.id })))
      return { error: STALE };
  } catch (error) {
    console.error("Recording joining failed", error);
    return { error: "We couldn't save that. Please try again." };
  }
  revalidatePath("/company", "layout");
  return {};
}

export async function reportExit(
  placementId: string,
  joiningDate: string,
  _prev: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const company = await requireCompany(COMPANY_SELECTED);
  const { values, errors } = validateLeaving(formData, joiningDate);
  if (Object.keys(errors).length > 0) return { errors };
  try {
    if (!(await reportLeaving(placementId, values, { companyId: company.id })))
      return { error: STALE };
  } catch (error) {
    console.error("Reporting exit failed", error);
    return { error: "We couldn't save that. Please try again." };
  }
  after(() => sendLeavingReported(placementId, values));
  revalidatePath("/company", "layout");
  return { ok: true };
}
