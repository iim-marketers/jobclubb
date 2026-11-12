import "server-only";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { sendEmail } from "@/lib/email/mailer";
import { franchiseOtpEmail, franchiseWelcomeEmail } from "@/lib/email/templates/franchise";
import {
  FRANCHISE_SOURCE,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MINUTES,
  type FranchiseCandidateInput,
} from "@/lib/franchise";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/server";
import type { FieldErrors } from "@/lib/sign-up-validation";
import { TERMS_VERSION } from "@/lib/terms-content";
import { isRateLimited } from "@/server/auth/confirmation-email";
import type { CurrentFranchise } from "@/server/franchises/current";

const UUID = /^[0-9a-f-]{36}$/i;

const INACTIVE = "Your franchise agreement isn't active, so you can't register candidates right now. Contact JobClubb head office.";
const SEND_FAILED = "We couldn't send the code. Check the email address and try again.";
const EXPIRED = "This registration has expired. Start again.";
const RATE_LIMITED = "A code was sent to this email moments ago. Wait a minute before sending another.";

function hashCode(registrationId: string, code: string) {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is not set.");
  return createHmac("sha256", secret).update(`${registrationId}:${code}`).digest("hex");
}

const newCode = () => String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");

const PASSWORD_TTL_MINUTES = 30;

const expiry = (minutes = OTP_TTL_MINUTES) => new Date(Date.now() + minutes * 60 * 1000).toISOString();

export type RegisteredCandidate = { id: string; name: string; email: string; phone: string };

// Any account type holds an email: candidates, companies and franchises share Supabase Auth.
async function emailTaken(email: string) {
  const admin = createAdminClient();
  const results = await Promise.all(
    (["candidates", "companies", "franchises"] as const).map((table) =>
      admin.from(table).select("id").eq("email", email).limit(1).maybeSingle(),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
  return results.some((r) => r.data);
}

// An account the franchise created but never paid for is an abandoned
// registration: the franchise can discard it, and registering the same email
// again replaces it.
async function abandonedCandidate(franchiseId: string, match: { email: string } | { id: string }) {
  const admin = createAdminClient();
  const query = admin.from("candidates").select("id, membership_paid_at").eq("franchise_id", franchiseId);
  const { data, error } = await ("id" in match ? query.eq("id", match.id) : query.eq("email", match.email)).maybeSingle();
  if (error) throw error;
  if (!data || data.membership_paid_at) return null;

  const { count, error: paidError } = await admin
    .from("membership_payments")
    .select("order_id", { count: "exact", head: true })
    .eq("candidate_id", data.id)
    .eq("status", "paid");
  if (paidError) throw paidError;
  return count ? null : (data.id as string);
}

async function deleteCandidateAccount(candidateId: string) {
  const { error } = await createAdminClient().auth.admin.deleteUser(candidateId);
  if (error) throw error;
}

async function sendCode(
  franchise: CurrentFranchise,
  details: FranchiseCandidateInput,
  code: string,
) {
  await sendEmail({
    to: details.email,
    ...franchiseOtpEmail({
      firstName: details.firstName,
      franchiseName: franchise.name,
      code,
      minutes: OTP_TTL_MINUTES,
      termsUrl: `${SITE_URL}/terms`,
      privacyUrl: `${SITE_URL}/privacy`,
    }),
  });
  await createAdminClient().from("email_sends").insert({ email: details.email, kind: "franchise_otp" });
}

export type StartResult =
  | { ok: true; registrationId: string; email: string }
  | { ok: false; errors?: Partial<Record<keyof FranchiseCandidateInput, string>>; error?: string };

export async function startRegistration(
  franchise: CurrentFranchise,
  details: FranchiseCandidateInput,
): Promise<StartResult> {
  if (franchise.status !== "active") return { ok: false, error: INACTIVE };

  const admin = createAdminClient();
  const abandoned = await abandonedCandidate(franchise.id, { email: details.email });
  if (!abandoned && (await emailTaken(details.email)))
    return {
      ok: false,
      errors: {
        email: "This email already has a JobClubb account, so it can't be registered again. Each candidate can only be registered once.",
      },
    };
  if (await isRateLimited(admin, details.email, "franchise_otp"))
    return { ok: false, errors: { email: RATE_LIMITED } };

  const { error: clearError } = await admin
    .from("franchise_registrations")
    .delete()
    .eq("franchise_id", franchise.id)
    .eq("email", details.email);
  if (clearError) throw clearError;

  const id = crypto.randomUUID();
  const code = newCode();
  const { error } = await admin.from("franchise_registrations").insert({
    id,
    franchise_id: franchise.id,
    email: details.email,
    details,
    code_hash: hashCode(id, code),
    expires_at: expiry(),
  });
  if (error) throw error;

  try {
    await sendCode(franchise, details, code);
  } catch (sendError) {
    console.error("Sending franchise registration code failed", sendError);
    await admin.from("franchise_registrations").delete().eq("id", id);
    return { ok: false, error: SEND_FAILED };
  }
  return { ok: true, registrationId: id, email: details.email };
}

type PendingRow = {
  id: string;
  franchise_id: string;
  email: string;
  details: FranchiseCandidateInput;
  code_hash: string;
  attempts: number;
  expires_at: string;
  verified_at: string | null;
};

async function loadPending(franchiseId: string, registrationId: string) {
  if (!UUID.test(registrationId)) return null;
  const { data, error } = await createAdminClient()
    .from("franchise_registrations")
    .select("id, franchise_id, email, details, code_hash, attempts, expires_at, verified_at")
    .eq("id", registrationId)
    .eq("franchise_id", franchiseId)
    .maybeSingle();
  if (error) throw error;
  return data as PendingRow | null;
}

export type ResendResult = { ok: true } | { ok: false; error: string; restart?: boolean };

export async function resendCode(
  franchise: CurrentFranchise,
  registrationId: string,
): Promise<ResendResult> {
  if (franchise.status !== "active") return { ok: false, error: INACTIVE };
  const pending = await loadPending(franchise.id, registrationId);
  if (!pending) return { ok: false, error: EXPIRED, restart: true };
  if (pending.verified_at) return { ok: false, error: "This email is already confirmed. Set their password." };

  const admin = createAdminClient();
  if (await isRateLimited(admin, pending.email, "franchise_otp")) return { ok: false, error: RATE_LIMITED };

  const code = newCode();
  const { error } = await admin
    .from("franchise_registrations")
    .update({ code_hash: hashCode(pending.id, code), attempts: 0, expires_at: expiry() })
    .eq("id", pending.id);
  if (error) throw error;

  try {
    await sendCode(franchise, pending.details, code);
  } catch (sendError) {
    console.error("Resending franchise registration code failed", sendError);
    return { ok: false, error: SEND_FAILED };
  }
  return { ok: true };
}

export type VerifyResult = { ok: true } | { ok: false; error: string; restart?: boolean };

export async function verifyRegistration(
  franchise: CurrentFranchise,
  registrationId: string,
  code: string,
): Promise<VerifyResult> {
  if (franchise.status !== "active") return { ok: false, error: INACTIVE, restart: true };
  const pending = await loadPending(franchise.id, registrationId);
  const admin = createAdminClient();
  if (!pending) return { ok: false, error: EXPIRED, restart: true };
  if (pending.verified_at) return { ok: true };

  if (new Date(pending.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "This code has expired. Send a new one." };
  }
  if (pending.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, error: "Too many wrong codes. Send a new one." };
  }

  const expected = Buffer.from(pending.code_hash, "hex");
  const given = Buffer.from(hashCode(pending.id, code), "hex");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    const attempts = pending.attempts + 1;
    const { error } = await admin
      .from("franchise_registrations")
      .update({ attempts })
      .eq("id", pending.id)
      .eq("attempts", pending.attempts);
    if (error) throw error;
    const left = OTP_MAX_ATTEMPTS - attempts;
    return {
      ok: false,
      error:
        left > 0
          ? `That code isn't right. ${left} ${left === 1 ? "try" : "tries"} left.`
          : "Too many wrong codes. Send a new one.",
    };
  }

  const { error } = await admin
    .from("franchise_registrations")
    .update({ verified_at: new Date().toISOString(), expires_at: expiry(PASSWORD_TTL_MINUTES) })
    .eq("id", pending.id);
  if (error) throw error;
  return { ok: true };
}

export type CompleteResult =
  | { ok: true; candidate: RegisteredCandidate }
  | { ok: false; errors?: FieldErrors; error?: string; restart?: boolean };

export async function completeRegistration(
  franchise: CurrentFranchise,
  registrationId: string,
  password: string,
): Promise<CompleteResult> {
  if (franchise.status !== "active") return { ok: false, error: INACTIVE, restart: true };
  const pending = await loadPending(franchise.id, registrationId);
  if (!pending || !pending.verified_at || new Date(pending.expires_at).getTime() < Date.now())
    return { ok: false, error: EXPIRED, restart: true };

  // Claiming the row first means a double submit can't create the account twice.
  const admin = createAdminClient();
  const { data: claimed, error: claimError } = await admin
    .from("franchise_registrations")
    .delete()
    .eq("id", pending.id)
    .select("id");
  if (claimError) throw claimError;
  if (claimed.length === 0)
    return { ok: false, error: "This candidate has just been registered. Check your candidates list.", restart: true };

  const details = pending.details;
  try {
    const abandoned = await abandonedCandidate(franchise.id, { email: pending.email });
    if (abandoned) await deleteCandidateAccount(abandoned);
  } catch (error) {
    await restorePending(pending);
    throw error;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: pending.email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "candidate",
      first_name: details.firstName,
      last_name: details.lastName,
      phone: details.phone,
      city: details.city,
      pincode: details.pincode,
      industry: details.industry,
      source: FRANCHISE_SOURCE,
      terms_version: TERMS_VERSION,
    },
  });
  if (createError) {
    if (createError.code === "email_exists" || createError.code === "user_already_exists")
      return {
        ok: false,
        error: "This email already has a JobClubb account, so it can't be registered again.",
        restart: true,
      };
    if (createError.code === "weak_password") {
      await restorePending(pending);
      return { ok: false, errors: { password: "This password is too easy to guess. Choose a stronger one." } };
    }
    await restorePending(pending);
    throw createError;
  }

  const candidateId = created.user.id;
  const { error: attributeError } = await admin
    .from("candidates")
    .update({ franchise_id: franchise.id, code: franchise.code })
    .eq("id", candidateId);
  if (attributeError) {
    await admin.auth.admin.deleteUser(candidateId);
    await restorePending(pending);
    throw attributeError;
  }

  await admin.from("franchise_registrations").delete().eq("email", pending.email);
  return {
    ok: true,
    candidate: {
      id: candidateId,
      name: `${details.firstName} ${details.lastName}`,
      email: pending.email,
      phone: details.phone,
    },
  };
}

// Lets the franchise retry the password step after a failure instead of
// verifying the email all over again.
async function restorePending(pending: PendingRow) {
  const { error } = await createAdminClient().from("franchise_registrations").insert(pending);
  if (error) console.error("Restoring franchise registration failed", error);
}

export async function discardPending(franchise: CurrentFranchise, registrationId: string) {
  if (!UUID.test(registrationId)) return;
  const { error } = await createAdminClient()
    .from("franchise_registrations")
    .delete()
    .eq("id", registrationId)
    .eq("franchise_id", franchise.id);
  if (error) throw error;
}

export async function discardCandidate(franchise: CurrentFranchise, candidateId: string) {
  if (!UUID.test(candidateId)) return false;
  const abandoned = await abandonedCandidate(franchise.id, { id: candidateId });
  if (!abandoned) return false;
  await deleteCandidateAccount(abandoned);
  return true;
}

// Sent once the first membership is paid, which is when registration is complete.
export async function sendWelcome(email: string, firstName: string, franchiseName: string) {
  try {
    await sendEmail({
      to: email,
      ...franchiseWelcomeEmail({
        firstName,
        franchiseName,
        email,
        signInUrl: `${SITE_URL}/sign-in`,
        forgotPasswordUrl: `${SITE_URL}/forgot-password`,
      }),
    });
  } catch (error) {
    console.error("Sending franchise candidate welcome email failed", error);
  }
}
