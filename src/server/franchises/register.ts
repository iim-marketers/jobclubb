import "server-only";

import { after } from "next/server";

import { validateFranchiseProfile, validateFranchiseSignUp } from "@/lib/franchise";
import type { FieldErrors } from "@/lib/sign-up-validation";
import { createAdminClient } from "@/lib/supabase/server";
import { sendConfirmationEmail } from "@/server/auth/confirmation-email";
import { sendNewFranchiseEmail } from "@/server/franchises/emails";
import { profileColumns } from "@/server/franchises/franchises";

const EMAIL_TAKEN = "An account with this email already exists. Sign in instead, or use a different email.";

export type RegisterFranchiseResult =
  | { ok: true; email: string }
  | { ok: false; errors: FieldErrors };

export async function registerFranchise(formData: FormData): Promise<RegisterFranchiseResult> {
  const errors = validateFranchiseSignUp(formData);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const { values } = validateFranchiseProfile(formData);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const admin = createAdminClient();

  // generateLink() on an existing unconfirmed email would silently keep the old password.
  const existing = await Promise.all(
    (["candidates", "companies", "franchises"] as const).map((table) =>
      admin.from(table).select("id").eq("email", email).limit(1).maybeSingle(),
    ),
  );
  if (existing.some((r) => r.data)) return { ok: false, errors: { email: EMAIL_TAKEN } };

  const result = await sendConfirmationEmail(admin, {
    email,
    firstName: values.ownerName.split(" ")[0],
    password: String(formData.get("password")),
    audience: "franchise",
    data: { role: "franchise", name: values.name, owner_name: values.ownerName },
  });

  if (!result.userId) {
    if (result.error === "email_exists") return { ok: false, errors: { email: EMAIL_TAKEN } };
    if (result.error === "weak_password") return { ok: false, errors: { password: "Choose a stronger password." } };
    if (result.error === "rate_limited") return { ok: false, errors: { email: "Please wait a minute before trying again." } };
    return { ok: false, errors: { email: "We couldn't create your account. Please try again." } };
  }

  const { error } = await admin
    .from("franchises")
    .insert({ id: result.userId, email, status: "pending", ...profileColumns(values) });
  if (error) {
    console.error("Saving franchise sign-up failed", error);
    await admin.auth.admin.deleteUser(result.userId);
    return { ok: false, errors: { email: "We couldn't create your account. Please try again." } };
  }

  after(() => sendNewFranchiseEmail(result.userId!));
  return { ok: true, email };
}
