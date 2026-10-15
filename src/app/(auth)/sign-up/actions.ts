"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { EmporiumCodeCheck } from "@/lib/emporium";
import {
  CODE_PATTERN,
  isEmporiumCode,
  type FieldErrors,
} from "@/lib/sign-up-validation";
import { PENDING_EMAIL_COOKIE } from "@/lib/supabase/session";
import { resendConfirmationEmail } from "@/server/auth/confirmation-email";
import { registerCandidate as registerCandidateAccount } from "@/server/candidates/register";
import { checkEmporiumCode } from "@/server/emporium/batches";

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
  redirect(
    `/sign-up/submitted?route=candidate${result.membershipIncluded ? "&membership=included" : ""}`,
  );
}

export async function checkSignUpCode(code: string): Promise<EmporiumCodeCheck | null> {
  const value = code.trim().toUpperCase();
  if (!CODE_PATTERN.test(value) || !isEmporiumCode(value)) return null;
  try {
    return await checkEmporiumCode(value);
  } catch (error) {
    console.error("Checking Emporium code failed", error);
    return null;
  }
}

export async function resendConfirmation(email: string): Promise<{ error?: string }> {
  return resendConfirmationEmail(email);
}
