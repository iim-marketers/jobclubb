"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { FieldErrors } from "@/lib/sign-up-validation";
import { PENDING_EMAIL_COOKIE } from "@/lib/supabase/session";
import {
  registerCandidate as registerCandidateAccount,
  resendCandidateConfirmation,
} from "@/server/candidates/register";

export async function registerCandidate(
  formData: FormData,
): Promise<{ errors: FieldErrors }> {
  const result = await registerCandidateAccount(formData);
  if (!result.ok) return { errors: result.errors };

  (await cookies()).set(PENDING_EMAIL_COOKIE, result.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  redirect("/sign-up/submitted?route=candidate");
}

export async function resendConfirmation(email: string): Promise<{ error?: string }> {
  return resendCandidateConfirmation(email);
}
