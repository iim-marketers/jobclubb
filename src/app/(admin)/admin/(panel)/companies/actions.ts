"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import type { AdminFormState } from "@/app/(admin)/admin/(panel)/placements/actions";
import { requireAdmin } from "@/server/admin/session";
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
