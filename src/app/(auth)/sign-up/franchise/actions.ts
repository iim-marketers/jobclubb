"use server";

import { redirect } from "next/navigation";

import { validateFranchise, type FieldErrors } from "@/lib/sign-up-validation";

export async function registerFranchise(
  formData: FormData,
): Promise<{ errors: FieldErrors }> {
  const errors = validateFranchise(formData);
  if (Object.keys(errors).length > 0) return { errors };

  // TODO: persist once the backend lands — check the email ID was actually
  // issued by head office and not already activated, create the franchise
  // account with a hashed password, generate its franchise code (SOP §3.1 lead
  // attribution), record T&C version + consent timestamp (DPDP), and queue the
  // business details (PAN / GSTIN) for head-office verification.

  redirect("/sign-up/submitted?route=franchise");
}
