import "server-only";

import { createClient } from "@supabase/supabase-js";

import { sendEmail } from "@/lib/email/mailer";
import { resetPasswordEmail } from "@/lib/email/templates/reset-password";
import { validateNewPassword, type FieldErrors } from "@/lib/sign-up-validation";
import { createAdminClient } from "@/lib/supabase/server";
import { SITE_URL, isRateLimited } from "@/server/auth/confirmation-email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ResetRole = "candidate" | "company";

async function findAccount(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<{ role: ResetRole; firstName?: string } | null> {
  const { data: candidate } = await admin
    .from("candidates")
    .select("first_name")
    .eq("email", email)
    .maybeSingle();
  if (candidate) return { role: "candidate", firstName: candidate.first_name };

  const { data: company } = await admin
    .from("companies")
    .select("contact_name")
    .eq("email", email)
    .maybeSingle();
  if (company) return { role: "company", firstName: company.contact_name.trim().split(/\s+/)[0] };

  return null;
}

export async function sendPasswordReset(email: string): Promise<{ error?: string }> {
  const address = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(address)) return { error: "Enter a valid email address." };

  const admin = createAdminClient();
  if (await isRateLimited(admin, address, "reset_password")) {
    return { error: "Please wait a minute before asking for another email." };
  }

  // Unknown addresses get the same response, so this can't be used to probe for accounts.
  const account = await findAccount(admin, address);
  if (!account) return {};

  const { data: link, error } = await admin.auth.admin.generateLink({ type: "recovery", email: address });
  if (error) {
    console.error("Generating password reset link failed", error);
    return { error: "We couldn't send the email. Please try again." };
  }

  const resetUrl = `${SITE_URL}/reset-password?token_hash=${encodeURIComponent(link.properties.hashed_token)}&as=${account.role}`;
  try {
    await sendEmail({
      to: address,
      ...resetPasswordEmail({ firstName: account.firstName, email: address, resetUrl, siteUrl: SITE_URL }),
    });
  } catch (sendError) {
    console.error("Sending password reset email failed", sendError);
    return { error: "We couldn't send the email. Please try again." };
  }

  await admin.from("email_sends").insert({ email: address, kind: "reset_password" });
  return {};
}

export type ResetPasswordResult =
  | { ok: true; email: string }
  | { ok: false; expired: true }
  | { ok: false; tokenHash: string; errors?: FieldErrors; error?: string };

// The token is only spent here, on submit, so link scanners that open emails can't use it up.
export async function resetPasswordWithToken(
  tokenHash: string,
  formData: FormData,
): Promise<ResetPasswordResult> {
  if (!tokenHash) return { ok: false, expired: true };
  const errors = validateNewPassword(formData);
  if (Object.keys(errors).length > 0) return { ok: false, tokenHash, errors };

  // verifyOtp() starts a session; keep it in memory so resetting doesn't sign anyone in.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
  const email = data.user?.email;
  if (error || !email) return { ok: false, expired: true };

  const { error: updateError } = await supabase.auth.updateUser({
    password: String(formData.get("password")),
  });

  if (updateError) {
    // The old token is spent, so the retry needs a fresh one.
    const { data: link } = await createAdminClient().auth.admin.generateLink({ type: "recovery", email });
    await supabase.auth.signOut({ scope: "local" });
    if (!link.properties) return { ok: false, expired: true };

    const retry = { ok: false as const, tokenHash: link.properties.hashed_token };
    if (updateError.code === "same_password") {
      return { ...retry, errors: { password: "Choose a password you haven't used here before." } };
    }
    if (updateError.code === "weak_password") {
      return { ...retry, errors: { password: "That password is too weak. Try a longer one." } };
    }
    console.error("Resetting password failed", updateError);
    return { ...retry, error: "We couldn't reset your password. Please try again." };
  }

  // Sign out every device, in case someone else had the old password.
  await supabase.auth.signOut({ scope: "global" });
  return { ok: true, email };
}
