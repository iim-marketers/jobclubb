"use server";

import { revalidatePath } from "next/cache";

import { decideCompany, type CompanyDecision } from "@/server/admin/companies";
import { requireAdmin } from "@/server/admin/session";

const DECISIONS = new Set<CompanyDecision>(["approve", "reject", "reopen"]);

export async function updateCompanyStatus(id: string, decision: CompanyDecision) {
  await requireAdmin();
  if (typeof id !== "string" || !DECISIONS.has(decision)) {
    return { ok: false as const, error: "Invalid request." };
  }

  const result = await decideCompany(id, decision);
  if (result.ok) revalidatePath("/admin", "layout");
  return result;
}
