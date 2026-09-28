"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { FieldErrors } from "@/lib/sign-up-validation";
import { PENDING_EMAIL_COOKIE } from "@/lib/supabase/session";
import { resetCandidatePassword } from "@/server/auth/password-reset";

export type ResetPasswordState = {
  tokenHash: string;
  expired?: boolean;
  errors?: FieldErrors;
  error?: string;
};

export async function resetPassword(
  prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const result = await resetCandidatePassword(prev.tokenHash, formData);
  if (!result.ok) {
    if ("expired" in result) return { tokenHash: "", expired: true };
    return { tokenHash: result.tokenHash, errors: result.errors, error: result.error };
  }

  (await cookies()).set(PENDING_EMAIL_COOKIE, result.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  redirect("/sign-in?reset=1");
}
