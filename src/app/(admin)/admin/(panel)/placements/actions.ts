"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { validateOfferTerms } from "@/lib/placements";
import type { FieldErrors } from "@/lib/sign-up-validation";
import { requireAdmin } from "@/server/admin/session";
import { deleteOfferDocument, offerFiles } from "@/server/placements/documents";
import {
  sendOfferDeclined,
  sendOfferSent,
  sendPlacementWithdrawn,
} from "@/server/placements/emails";
import {
  declinePlacement,
  linkReplacement,
  markOfferReceived,
  recordJoining,
  sendOfferLetter,
  storeAdminDocuments,
  updatePlacementTerms,
  waiveReplacement,
  withdrawPlacement,
} from "@/server/placements/placements";

export type AdminFormState = { errors?: FieldErrors; error?: string; ok?: boolean };
type Result = { error?: string };

const STALE = "This placement has already changed. Refresh to see the latest.";

function refresh(id: string) {
  revalidatePath("/admin/placements");
  revalidatePath(`/admin/placements/${id}`);
  revalidatePath("/admin", "layout");
}

async function attempt(id: string, label: string, run: () => Promise<boolean | string | void>): Promise<Result> {
  try {
    const outcome = await run();
    if (outcome === false) return { error: STALE };
    if (typeof outcome === "string") return { error: outcome };
  } catch (error) {
    console.error(`${label} failed`, error);
    return { error: "Something went wrong. Please try again." };
  }
  refresh(id);
  return {};
}

export async function saveTerms(id: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const { values, errors } = validateOfferTerms(formData);
  if (Object.keys(errors).length > 0) return { errors };
  const result = await attempt(id, "Saving placement terms", () => updatePlacementTerms(id, values));
  return result.error ? result : { ok: true };
}

export async function uploadDocuments(id: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const result = await attempt(id, "Uploading offer documents", async () => {
    const error = await storeAdminDocuments(id, offerFiles(formData));
    if (error) return error;
    await markOfferReceived(id);
  });
  return result.error ? { errors: { documents: result.error } } : { ok: true };
}

export async function removeDocument(id: string, documentId: string): Promise<Result> {
  await requireAdmin();
  return attempt(id, "Removing offer document", () => deleteOfferDocument(id, documentId));
}

export async function sendOffer(id: string): Promise<Result> {
  await requireAdmin();
  const result = await attempt(id, "Sending offer letter", async () => {
    const sent = await sendOfferLetter(id);
    if (!sent.ok) return sent.error;
  });
  if (!result.error) after(() => sendOfferSent(id));
  return result;
}

export async function markDeclined(id: string): Promise<Result> {
  await requireAdmin();
  const result = await attempt(id, "Declining offer", () => declinePlacement(id));
  if (!result.error) after(() => sendOfferDeclined(id));
  return result;
}

export async function withdraw(id: string): Promise<Result> {
  await requireAdmin();
  let candidateWasTold = false;
  const result = await attempt(id, "Withdrawing offer", async () => {
    const withdrawn = await withdrawPlacement(id);
    if (!withdrawn) return false;
    candidateWasTold = withdrawn.candidateWasTold;
  });
  if (!result.error) after(() => sendPlacementWithdrawn(id, candidateWasTold, false));
  return result;
}

export async function markJoining(id: string, joined: boolean): Promise<Result> {
  await requireAdmin();
  return attempt(id, "Recording joining", () => recordJoining(id, joined));
}

export async function saveReplacement(id: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const ref = String(formData.get("ref") ?? "");
  if (!ref) return { errors: { ref: "Choose the candidate JobClubb referred." } };
  const result = await attempt(id, "Linking replacement", () => linkReplacement(id, ref));
  if (result.error) return result;
  revalidatePath("/company", "layout");
  return { ok: true };
}

export async function closeReplacement(id: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return { errors: { note: "Say why no replacement is needed." } };
  if (note.length > 1000) return { errors: { note: "Use 1,000 characters or fewer." } };
  const result = await attempt(id, "Closing replacement", () => waiveReplacement(id, note));
  if (result.error) return result;
  revalidatePath("/company", "layout");
  return { ok: true };
}
