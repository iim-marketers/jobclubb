"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { validateOfferTerms } from "@/lib/placements";
import type { FieldErrors } from "@/lib/sign-up-validation";
import { requireAdmin } from "@/server/admin/session";
import { deleteOfferDocument, offerFiles } from "@/server/placements/documents";
import {
  sendOfferDeclined,
  sendOfferReleased,
  sendPlacementWithdrawn,
} from "@/server/placements/emails";
import {
  declinePlacement,
  extendPlacementDeadline,
  markOfferReceived,
  recordJoining,
  releasePlacement,
  saveAdminNotes,
  storeAdminDocuments,
  updatePlacementTerms,
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

export async function release(id: string): Promise<Result> {
  await requireAdmin();
  const result = await attempt(id, "Releasing offer", async () => {
    const released = await releasePlacement(id);
    if (!released.ok) return released.error;
  });
  if (!result.error) after(() => sendOfferReleased(id));
  return result;
}

export async function extendDeadline(id: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const offerDeadline = String(formData.get("offerDeadline") ?? "");
  const joiningDate = String(formData.get("joiningDate") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(offerDeadline)) return { errors: { offerDeadline: "Choose a date." } };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(joiningDate)) return { errors: { joiningDate: "Choose a date." } };
  const result = await attempt(id, "Extending offer deadline", async () => {
    const extended = await extendPlacementDeadline(id, { offerDeadline, joiningDate });
    if (!extended.ok) return extended.error;
  });
  return result.error ? result : { ok: true };
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

export async function saveNotes(id: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const notes = String(formData.get("adminNotes") ?? "").trim();
  if (notes.length > 4000) return { errors: { adminNotes: "Use 4,000 characters or fewer." } };
  const result = await attempt(id, "Saving placement notes", () => saveAdminNotes(id, notes));
  return result.error ? result : { ok: true };
}
