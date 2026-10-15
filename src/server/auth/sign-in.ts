import "server-only";

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

import type { FieldErrors } from "@/lib/sign-up-validation";
import { createAdminClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignInResult =
  | { ok: true; user: User; session: Session }
  | { ok: false; errors: FieldErrors; unconfirmedEmail?: string };

type AccountRole = "candidate" | "company";

const ACCOUNT_TABLES = { candidate: "candidates", company: "companies" } as const;

const NO_ACCOUNT_ERRORS: Record<AccountRole, string> = {
  candidate: "We couldn't find a candidate account with this email. Check the spelling, or create an account below.",
  company: "We couldn't find a company account with this email. Check the spelling, or register your company below.",
};

const OTHER_ROLE_ERRORS: Record<AccountRole, string> = {
  candidate: "This email is registered as a company account. Choose Company above to sign in.",
  company: "This email is registered as a candidate account. Choose Candidate above to sign in.",
};

const COMPANY_STATUS_ERRORS: Record<string, string> = {
  pending_email: "Confirm your email before signing in.",
  rejected: "We couldn't verify your company. Contact support@jobclubb.com for help.",
};

// The caller picks where the session lives: a cookie-bound client for the web,
// a non-persisting one for API clients that take the tokens from `session`.
export async function signInCandidate(
  supabase: SupabaseClient,
  credentials: { email: string; password: string },
): Promise<SignInResult> {
  const result = await signInWithPassword(supabase, credentials, "candidate");
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
  const result = await signInWithPassword(supabase, credentials, "company");
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
  role: AccountRole,
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
    if (error.code === "invalid_credentials") return invalidCredentials(address, role);
    console.error("Sign-in failed", error);
    return { ok: false, errors: { password: "We couldn't sign you in. Please try again." } };
  }

  return { ok: true, user: data.user, session: data.session };
}

async function invalidCredentials(email: string, role: AccountRole): Promise<SignInResult> {
  const admin = createAdminClient();
  const otherRole: AccountRole = role === "candidate" ? "company" : "candidate";
  const [own, other] = await Promise.all(
    [role, otherRole].map((r) =>
      admin.from(ACCOUNT_TABLES[r]).select("id").eq("email", email).limit(1).maybeSingle(),
    ),
  );

  if (own.error || other.error) {
    console.error("Sign-in account lookup failed", own.error ?? other.error);
    return { ok: false, errors: { password: "Incorrect email or password." } };
  }
  if (own.data)
    return { ok: false, errors: { password: "Incorrect password. Try again, or reset it with Forgot password." } };
  if (other.data) return { ok: false, errors: { role: OTHER_ROLE_ERRORS[role] } };
  return { ok: false, errors: { email: NO_ACCOUNT_ERRORS[role] } };
}
