"use server";

import { revalidatePath } from "next/cache";

import { COMPANY_HOME } from "@/components/company/nav";
import { requireCompany } from "@/server/auth/current-company";
import {
  markApplicantViewed,
  rejectApplicant,
  shortlistApplicant,
} from "@/server/applications/company";

const STALE = "This applicant has already moved on. Refresh to see the latest.";

export async function markViewed(ref: string): Promise<void> {
  const company = await requireCompany(`${COMPANY_HOME}/applicants/${ref}`);
  try {
    if (await markApplicantViewed(company.id, ref)) revalidatePath("/company", "layout");
  } catch (error) {
    console.error("Marking applicant viewed failed", error);
  }
}

export async function shortlist(ref: string): Promise<{ error?: string }> {
  const company = await requireCompany(`${COMPANY_HOME}/applicants/${ref}`);
  try {
    if ((await shortlistApplicant(company.id, ref)) === "unchanged") return { error: STALE };
  } catch (error) {
    console.error("Shortlisting applicant failed", error);
    return { error: "We couldn't shortlist this applicant. Please try again." };
  }
  revalidatePath("/company", "layout");
  return {};
}

export async function reject(ref: string): Promise<{ error?: string }> {
  const company = await requireCompany(`${COMPANY_HOME}/applicants/${ref}`);
  try {
    if (!(await rejectApplicant(company.id, ref))) return { error: STALE };
  } catch (error) {
    console.error("Rejecting applicant failed", error);
    return { error: "We couldn't update this applicant. Please try again." };
  }
  revalidatePath("/company", "layout");
  return {};
}
