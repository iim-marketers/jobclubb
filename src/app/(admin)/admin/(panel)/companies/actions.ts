"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import type { AdminFormState } from "@/app/(admin)/admin/(panel)/placements/actions";
import { validatePartnerCompany } from "@/lib/sign-up-validation";
import { createPartnerCompany } from "@/server/admin/companies";
import { requireAdmin } from "@/server/admin/session";
import { isAcceptedLogo } from "@/server/companies/logo";
import { sendChangeReviewed } from "@/server/companies/change-request-emails";
import {
  approveChangeRequest,
  rejectChangeRequest,
} from "@/server/companies/change-requests";

const STALE = "This request has already been reviewed or withdrawn. Refresh to see the latest.";

function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/company", "layout");
}

export async function createPartner(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const { values, errors } = validatePartnerCompany(formData);
  const logo = formData.get("logo");
  const hasLogo = logo instanceof File && logo.size > 0;
  if (hasLogo && !isAcceptedLogo(logo)) errors.logo = "Choose a JPG, PNG or WebP image.";
  if (Object.keys(errors).length > 0) return { errors };

  let id: string;
  try {
    const result = await createPartnerCompany(values, hasLogo ? logo : null);
    if (!result.ok) return { errors: result.errors };
    id = result.id;
  } catch (error) {
    console.error("Creating partner company failed", error);
    return { error: "Something went wrong. Please try again." };
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/companies?company=${id}`);
}

export async function approveChange(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  try {
    if (!(await approveChangeRequest(id))) return { error: STALE };
  } catch (error) {
    console.error("Approving company change failed", error);
    return { error: "Something went wrong. Please try again." };
  }
  refresh();
  after(() => sendChangeReviewed(id));
  return {};
}

export async function rejectChange(
  id: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return { errors: { note: "Tell the company why, so they can fix it." } };
  if (note.length > 500) return { errors: { note: "Use 500 characters or fewer." } };

  try {
    if (!(await rejectChangeRequest(id, note))) return { error: STALE };
  } catch (error) {
    console.error("Rejecting company change failed", error);
    return { error: "Something went wrong. Please try again." };
  }
  refresh();
  after(() => sendChangeReviewed(id));
  return { ok: true };
}
