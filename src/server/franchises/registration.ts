import "server-only";

import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { after } from "next/server";

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
import { TERMS_VERSION } from "@/lib/terms-content";
import { isRateLimited } from "@/server/auth/confirmation-email";
import type { CurrentFranchise } from "@/server/franchises/current";

const UUID = /^[0-9a-f-]{36}$/i;

const INACTIVE = "Your franchise agreement isn't active, so you can't register candidates right now. Contact JobClubb head office.";
const SEND_FAILED = "We couldn't send the code. Check the email address and try again.";
const RATE_LIMITED = "A code was sent to this email moments ago. Wait a minute before sending another.";

function hashCode(registrationId: string, code: string) {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is not set.");
  return createHmac("sha256", secret).update(`${registrationId}:${code}`).digest("hex");
}

const newCode = () => String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");

const expiry = () => new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

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
  if (await emailTaken(details.email))
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
  email: string;
  details: FranchiseCandidateInput;
  code_hash: string;
  attempts: number;
  expires_at: string;
};

async function loadPending(franchiseId: string, registrationId: string) {
  if (!UUID.test(registrationId)) return null;
  const { data, error } = await createAdminClient()
    .from("franchise_registrations")
    .select("id, email, details, code_hash, attempts, expires_at")
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
  if (!pending) return { ok: false, error: "This registration has expired. Start again.", restart: true };

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

export type VerifyResult =
  | { ok: true; candidateId: string; name: string }
  | { ok: false; error: string; restart?: boolean };

export async function verifyRegistration(
  franchise: CurrentFranchise,
  registrationId: string,
  code: string,
): Promise<VerifyResult> {
  if (franchise.status !== "active") return { ok: false, error: INACTIVE, restart: true };
  const pending = await loadPending(franchise.id, registrationId);
  const admin = createAdminClient();
  if (!pending) return { ok: false, error: "This registration has expired. Start again.", restart: true };

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

  // Claiming the row first means a double submit can't create the account twice.
  const { data: claimed, error: claimError } = await admin
    .from("franchise_registrations")
    .delete()
    .eq("id", pending.id)
    .select("id");
  if (claimError) throw claimError;
  if (claimed.length === 0)
    return { ok: false, error: "This candidate has just been registered. Check your candidates list.", restart: true };

  const details = pending.details;
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: pending.email,
    password: randomBytes(32).toString("base64url"),
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
    throw createError;
  }

  const candidateId = created.user.id;
  const { error: attributeError } = await admin
    .from("candidates")
    .update({ franchise_id: franchise.id, code: franchise.code })
    .eq("id", candidateId);
  if (attributeError) {
    await admin.auth.admin.deleteUser(candidateId);
    throw attributeError;
  }

  await admin.from("franchise_registrations").delete().eq("email", pending.email);
  after(() => sendWelcome(pending.email, details.firstName, franchise.name));
  return { ok: true, candidateId, name: `${details.firstName} ${details.lastName}` };
}

async function sendWelcome(email: string, firstName: string, franchiseName: string) {
  try {
    const { data: link, error } = await createAdminClient().auth.admin.generateLink({
      type: "recovery",
      email,
    });
    if (error) throw error;
    const setPasswordUrl = `${SITE_URL}/reset-password?token_hash=${encodeURIComponent(link.properties.hashed_token)}&as=candidate&welcome=1`;
    await sendEmail({
      to: email,
      ...franchiseWelcomeEmail({
        firstName,
        franchiseName,
        setPasswordUrl,
        forgotPasswordUrl: `${SITE_URL}/forgot-password`,
      }),
    });
  } catch (error) {
    console.error("Sending franchise candidate welcome email failed", error);
  }
}

export async function resendWelcome(franchise: CurrentFranchise, candidateId: string) {
  if (!UUID.test(candidateId)) return false;
  const { data, error } = await createAdminClient()
    .from("candidates")
    .select("email, first_name")
    .eq("id", candidateId)
    .eq("franchise_id", franchise.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return false;
  if (await isRateLimited(createAdminClient(), data.email, "reset_password")) return "rate_limited";
  await sendWelcome(data.email, data.first_name, franchise.name);
  await createAdminClient().from("email_sends").insert({ email: data.email, kind: "reset_password" });
  return true;
}
