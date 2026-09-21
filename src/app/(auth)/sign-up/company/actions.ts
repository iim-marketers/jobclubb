"use server";

import { redirect } from "next/navigation";

import { assessCompanyVerification } from "@/lib/company-verification";
import { validateCompany, type FieldErrors } from "@/lib/sign-up-validation";

export async function registerCompany(
  formData: FormData,
): Promise<{ errors: FieldErrors }> {
  const errors = validateCompany(formData);
  if (Object.keys(errors).length > 0) return { errors };

  const route = assessCompanyVerification({
    email: String(formData.get("email")),
    size: String(formData.get("size")),
    website: String(formData.get("website") ?? ""),
  })!.route;

  // TODO: persist once the backend lands — create the company (status
  // "pending_email" or "pending_review"), the admin user with a hashed password,
  // store the proof document, record T&C version + consent timestamp (DPDP), and
  // send the confirmation email / notify the admin review queue.

  redirect(`/sign-up/submitted?route=${route}`);
}
