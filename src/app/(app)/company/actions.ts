"use server";

import { revalidatePath } from "next/cache";

import { COMPANY_HOME } from "@/components/company/nav";
import { requireCompany } from "@/server/auth/current-company";
import { acceptCurrentTerms } from "@/server/auth/terms";

export async function acceptCompanyTerms(): Promise<{ error?: string }> {
  const company = await requireCompany(COMPANY_HOME);
  try {
    await acceptCurrentTerms("companies", company.id);
  } catch (error) {
    console.error("Accepting company terms failed", error);
    return { error: "We couldn't save that. Please try again." };
  }
  revalidatePath("/company", "layout");
  return {};
}
