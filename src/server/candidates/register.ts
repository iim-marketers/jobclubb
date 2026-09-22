import "server-only";

import { sendConfirmationEmail } from "@/server/auth/confirmation-email";
import { createAdminClient } from "@/lib/supabase/server";
import { isStudentCode, validateCandidate, type FieldErrors } from "@/lib/sign-up-validation";
import { TERMS_VERSION } from "@/lib/terms-content";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_TAKEN = "An account with this email already exists. Sign in instead.";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export type RegisterCandidateResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; errors: FieldErrors };

export async function registerCandidate(formData: FormData): Promise<RegisterCandidateResult> {
  const errors = validateCandidate(formData);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const email = text(formData, "email").toLowerCase();
  const code = text(formData, "code").toUpperCase();
  const firstName = text(formData, "firstName");
  const admin = createAdminClient();

  // generateLink() on an existing unconfirmed email would silently keep the old password.
  const { data: existing } = await admin
    .from("candidates")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) return { ok: false, errors: { email: EMAIL_TAKEN } };

  const result = await sendConfirmationEmail(admin, {
    email,
    firstName,
    password: String(formData.get("password")),
    data: {
      role: "candidate",
      first_name: firstName,
      last_name: text(formData, "lastName"),
      phone: text(formData, "phone"),
      city: text(formData, "city"),
      pincode: text(formData, "pincode"),
      vertical: text(formData, "vertical"),
      source: text(formData, "source"),
      code,
      terms_version: TERMS_VERSION,
    },
  });

  if (!result.userId) {
    if (result.error === "email_exists") return { ok: false, errors: { email: EMAIL_TAKEN } };
    if (result.error === "weak_password") {
      return { ok: false, errors: { password: "Choose a stronger password." } };
    }
    if (result.error === "rate_limited") {
      return { ok: false, errors: { email: "Please wait a minute before trying again." } };
    }
    return { ok: false, errors: { email: "We couldn't create your account. Please try again." } };
  }

  const studentId = formData.get("studentId");
  if (isStudentCode(code) && studentId instanceof File && studentId.size > 0) {
    await storeStudentId(result.userId, studentId);
  }

  // TODO: attribute the franchise / referral code to its owner (SOP §3.1)
  // once franchise accounts are on Supabase.

  return { ok: true, userId: result.userId, email };
}

export async function resendCandidateConfirmation(email: string): Promise<{ error?: string }> {
  const address = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(address)) return { error: "Enter a valid email address." };

  // generateLink() on an unknown address would create a new account.
  const admin = createAdminClient();
  const { data: candidate } = await admin
    .from("candidates")
    .select("first_name")
    .eq("email", address)
    .maybeSingle();
  if (!candidate) return { error: "We couldn't find a JobClubb account for that email." };

  const { error } = await sendConfirmationEmail(admin, {
    email: address,
    firstName: candidate.first_name,
  });

  if (error === "rate_limited") return { error: "Please wait a minute before asking for another email." };
  if (error === "email_exists") return { error: "Your email is already confirmed. Sign in instead." };
  if (error) return { error: "We couldn't send the email. Please try again." };
  return {};
}

async function storeStudentId(userId: string, file: File) {
  const extensions: Record<string, string> = { "application/pdf": "pdf", "image/png": "png" };
  const extension = extensions[file.type] ?? "jpg";
  const path = `${userId}/student-id.${extension}`;

  try {
    const admin = createAdminClient();
    const upload = await admin.storage
      .from("student-ids")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upload.error) throw upload.error;

    const update = await admin
      .from("candidates")
      .update({ student_id_path: path, student_id_status: "pending" })
      .eq("id", userId);
    if (update.error) throw update.error;
  } catch (error) {
    console.error("Student ID upload failed", error);
  }
}
