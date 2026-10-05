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

  // TODO: persist the registration once the backend lands.

  redirect(`/sign-up/submitted?route=${route}`);
}
