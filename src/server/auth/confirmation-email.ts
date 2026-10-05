import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { sendEmail } from "@/lib/email/mailer";
import { createAdminClient } from "@/lib/supabase/server";
import { confirmSignupEmail } from "@/lib/email/templates/confirm-signup";

// Never the request's Origin header: it can be forged to point email links elsewhere.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_GAP_SECONDS = 60;
const MAX_PER_HOUR = 5;

export type ConfirmationResult = {
  userId?: string;
  error?: "rate_limited" | "email_exists" | "weak_password" | "failed" | "send_failed";
};

export async function sendConfirmationEmail(
  admin: SupabaseClient,
  {
    email,
    firstName,
    password,
    data,
    audience,
  }: {
    email: string;
    firstName?: string;
    password?: string;
    data?: Record<string, unknown>;
    audience?: "candidate" | "company";
  },
): Promise<ConfirmationResult> {
  if (await isRateLimited(admin, email, "confirm_signup")) return { error: "rate_limited" };

  const { data: link, error } = await admin.auth.admin.generateLink(
    password
      ? { type: "signup", email, password, options: { data } }
      : ({ type: "signup", email } as Parameters<typeof admin.auth.admin.generateLink>[0]),
  );

  if (error) {
    if (error.code === "email_exists" || error.code === "user_already_exists") {
      return { error: "email_exists" };
    }
    if (error.code === "weak_password") return { error: "weak_password" };
    console.error("Generating confirmation link failed", error);
    return { error: "failed" };
  }

  const { hashed_token, verification_type } = link.properties;
  const confirmUrl =
    `${SITE_URL}/auth/confirm?token_hash=${encodeURIComponent(hashed_token)}` +
    `&type=${verification_type}`;

  try {
    await sendEmail({
      to: email,
      ...confirmSignupEmail({ firstName, email, confirmUrl, siteUrl: SITE_URL, audience }),
    });
  } catch (sendError) {
    console.error("Sending confirmation email failed", sendError);
    return { userId: link.user.id, error: "send_failed" };
  }

  await admin.from("email_sends").insert({ email, kind: "confirm_signup" });
  return { userId: link.user.id };
}

export async function resendConfirmationEmail(email: string): Promise<{ error?: string }> {
  const address = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(address)) return { error: "Enter a valid email address." };

  // generateLink() on an unknown address would create a new account.
  const admin = createAdminClient();
  const [{ data: candidate }, { data: company }] = await Promise.all([
    admin.from("candidates").select("first_name").eq("email", address).maybeSingle(),
    admin.from("companies").select("contact_name").eq("email", address).maybeSingle(),
  ]);
  if (!candidate && !company) return { error: "We couldn't find a JobClubb account for that email." };

  const { error } = await sendConfirmationEmail(admin, {
    email: address,
    firstName: candidate?.first_name ?? company?.contact_name.split(" ")[0],
    audience: company ? "company" : "candidate",
  });

  if (error === "rate_limited") return { error: "Please wait a minute before asking for another email." };
  if (error === "email_exists") return { error: "Your email is already confirmed. Sign in instead." };
  if (error) return { error: "We couldn't send the email. Please try again." };
  return {};
}

export async function isRateLimited(
  admin: SupabaseClient,
  email: string,
  kind: "confirm_signup" | "reset_password",
) {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("email_sends")
    .select("sent_at")
    .eq("email", email)
    .eq("kind", kind)
    .gte("sent_at", hourAgo)
    .order("sent_at", { ascending: false });

  if (error) {
    console.error("Checking email rate limit failed", error);
    return false;
  }
  if (data.length >= MAX_PER_HOUR) return true;
  const last = data[0] && new Date(data[0].sent_at).getTime();
  return !!last && Date.now() - last < MIN_GAP_SECONDS * 1000;
}
