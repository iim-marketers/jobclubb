import "server-only";

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

import type { FieldErrors } from "@/lib/sign-up-validation";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignInCandidateResult =
  | { ok: true; user: User; session: Session }
  | { ok: false; errors: FieldErrors; unconfirmedEmail?: string };

// The caller picks where the session lives: a cookie-bound client for the web,
// a non-persisting one for API clients that take the tokens from `session`.
export async function signInCandidate(
  supabase: SupabaseClient,
  { email, password }: { email: string; password: string },
): Promise<SignInCandidateResult> {
  const address = email.trim().toLowerCase();
  const errors: FieldErrors = {};
  if (!EMAIL_PATTERN.test(address)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const { data, error } = await supabase.auth.signInWithPassword({ email: address, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { ok: false, errors: {}, unconfirmedEmail: address };
    }
    if (error.code === "invalid_credentials") {
      return { ok: false, errors: { password: "Incorrect email or password." } };
    }
    console.error("Sign-in failed", error);
    return { ok: false, errors: { password: "We couldn't sign you in. Please try again." } };
  }

  const { data: candidate } = await supabase
    .from("candidates")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!candidate) {
    await supabase.auth.signOut();
    return {
      ok: false,
      errors: { role: "This account isn't a candidate account. Choose the right account type." },
    };
  }

  return { ok: true, user: data.user, session: data.session };
}
