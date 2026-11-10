import "server-only";

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

import type { FieldErrors } from "@/lib/sign-up-validation";
import { createAdminClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignInResult =
  | { ok: true; user: User; session: Session }
  | { ok: false; errors: FieldErrors; unconfirmedEmail?: string };

type AccountRole = "candidate" | "company" | "franchise";

const ACCOUNT_TABLES = {
  candidate: "candidates",
  company: "companies",
  franchise: "franchises",
} as const;

const ROLE_NAMES: Record<AccountRole, string> = {
  candidate: "Candidate",
  company: "Company",
  franchise: "Franchise",
};

const NO_ACCOUNT_ERRORS: Record<AccountRole, string> = {
  candidate: "We couldn't find a candidate account with this email. Check the spelling, or create an account below.",
  company: "We couldn't find a company account with this email. Check the spelling, or register your company below.",
  franchise: "We couldn't find a franchise account with this email. Check the spelling, or sign up as a franchise below.",
};

const otherRoleError = (role: AccountRole) =>
  `This email is registered as a ${ROLE_NAMES[role].toLowerCase()} account. Choose ${ROLE_NAMES[role]} above to sign in.`;

const FRANCHISE_STATUS_ERRORS: Record<string, string> = {
  pending:
    "Your franchise application is being reviewed. We'll email you as soon as it's approved, usually once the franchise agreement is signed.",
  rejected: "We couldn't approve your franchise application. Contact support@jobclubb.com for help.",
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

export async function signInFranchise(
  supabase: SupabaseClient,
  credentials: { email: string; password: string },
): Promise<SignInResult> {
  const result = await signInWithPassword(supabase, credentials, "franchise");
  if (!result.ok) return result;

  const { data: franchise } = await supabase
    .from("franchises")
    .select("status")
    .eq("id", result.user.id)
    .maybeSingle();

  if (!franchise || franchise.status !== "approved") {
    await supabase.auth.signOut();
    return {
      ok: false,
      errors: franchise
        ? { email: FRANCHISE_STATUS_ERRORS[franchise.status] ?? FRANCHISE_STATUS_ERRORS.pending }
        : { role: "This account isn't a franchise account. Choose the right account type." },
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
  const roles = Object.keys(ACCOUNT_TABLES) as AccountRole[];
  const results = await Promise.all(
    roles.map((r) =>
      admin.from(ACCOUNT_TABLES[r]).select("id").eq("email", email).limit(1).maybeSingle(),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed) {
    console.error("Sign-in account lookup failed", failed.error);
    return { ok: false, errors: { password: "Incorrect email or password." } };
  }
  const owner = roles.find((_, i) => results[i].data);
  if (owner === role)
    return { ok: false, errors: { password: "Incorrect password. Try again, or reset it with Forgot password." } };
  if (owner) return { ok: false, errors: { role: otherRoleError(owner) } };
  return { ok: false, errors: { email: NO_ACCOUNT_ERRORS[role] } };
}
