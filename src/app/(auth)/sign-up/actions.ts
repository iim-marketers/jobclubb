"use server";

import { redirect } from "next/navigation";

import { validateCandidate, type FieldErrors } from "@/lib/sign-up-validation";

export async function registerCandidate(
  formData: FormData,
): Promise<{ errors: FieldErrors }> {
  const errors = validateCandidate(formData);
  if (Object.keys(errors).length > 0) return { errors };

  // TODO: persist once the backend lands — create the candidate, attribute the
  // sourcing channel / code (SOP §3.1), store the student ID for review, record
  // T&C version + consent timestamp (DPDP), and send the welcome email.

  redirect("/sign-up/submitted?route=candidate");
}
