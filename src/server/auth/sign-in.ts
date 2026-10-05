import "server-only";

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

import type { FieldErrors } from "@/lib/sign-up-validation";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignInResult =
  | { ok: true; user: User; session: Session }
  | { ok: false; errors: FieldErrors; unconfirmedEmail?: string };

const COMPANY_STATUS_ERRORS: Record<string, string> = {
  pending_email: "Confirm your email before signing in.",
  pending_review: "Our team is still verifying your company. We'll email you once it's approved.",
  rejected: "We couldn't verify your company. Contact contact@jobclubb.com for help.",
};

// The caller picks where the session lives: a cookie-bound client for the web,
// a non-persisting one for API clients that take the tokens from `session`.
export async function signInCandidate(
  supabase: SupabaseClient,
  credentials: { email: string; password: string },
): Promise<SignInResult> {
  const result = await signInWithPassword(supabase, credentials);
  if (!result.ok) return result;

  const { data: candidate } = await supabase
    .from("candidates")
    .select("id")
    .eq("id", result.user.id)
    .maybeSingle();

  if (!candidate) {
    await supabase.auth.signOut();
    return {
      ok: false,
      errors: { role: "This account isn't a candidate account. Choose the right account type." },
    };
  }

  return result;
}

export async function signInCompany(
  supabase: SupabaseClient,
  credentials: { email: string; password: string },
): Promise<SignInResult> {
  const result = await signInWithPassword(supabase, credentials);
  if (!result.ok) return result;

  const { data: company } = await supabase
    .from("companies")
    .select("status")
    .eq("id", result.user.id)
    .maybeSingle();

  if (!company || company.status !== "verified") {
    await supabase.auth.signOut();
    return {
      ok: false,
      errors: company
        ? { email: COMPANY_STATUS_ERRORS[company.status] }
        : { role: "This account isn't a company account. Choose the right account type." },
    };
  }

  return result;
}

async function signInWithPassword(
  supabase: SupabaseClient,
  { email, password }: { email: string; password: string },
): Promise<SignInResult> {
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

  return { ok: true, user: data.user, session: data.session };
}
