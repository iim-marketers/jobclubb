import "server-only";

import { assessCompanyVerification, type VerificationRoute } from "@/lib/company-verification";
import { validateCompany, type FieldErrors } from "@/lib/sign-up-validation";
import { createAdminClient } from "@/lib/supabase/server";
import { TERMS_VERSION } from "@/lib/terms-content";
import { sendConfirmationEmail } from "@/server/auth/confirmation-email";

const EMAIL_TAKEN = "An account with this email already exists. Each property needs its own email.";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export type RegisterCompanyResult =
  | { ok: true; userId: string; email: string; route: Exclude<VerificationRoute, "blocked"> }
  | { ok: false; errors: FieldErrors };

export async function registerCompany(formData: FormData): Promise<RegisterCompanyResult> {
  const errors = validateCompany(formData);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const email = text(formData, "email").toLowerCase();
  const contactName = text(formData, "contactName");
  const website = text(formData, "website");
  const route = assessCompanyVerification({ email, size: text(formData, "size"), website })!.route;
  if (route === "blocked") return { ok: false, errors: { email: "Use your corporate email address." } };

  const admin = createAdminClient();

  // generateLink() on an existing unconfirmed email would silently keep the old password.
  const [{ data: company }, { data: candidate }] = await Promise.all([
    admin.from("companies").select("id").eq("email", email).maybeSingle(),
    admin.from("candidates").select("id").eq("email", email).maybeSingle(),
  ]);
  if (company || candidate) return { ok: false, errors: { email: EMAIL_TAKEN } };

  const result = await sendConfirmationEmail(admin, {
    email,
    firstName: contactName.split(" ")[0],
    password: String(formData.get("password")),
    audience: "company",
    data: {
      role: "company",
      company_name: text(formData, "companyName"),
      property_name: text(formData, "propertyName"),
      industry: text(formData, "industry"),
      size: text(formData, "size"),
      website,
      gstin: text(formData, "gstin").toUpperCase(),
      city: text(formData, "city"),
      pincode: text(formData, "pincode"),
      contact_name: contactName,
      designation: text(formData, "designation"),
      phone: text(formData, "phone"),
      verification_route: route,
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

  const proof = formData.get("proof");
  if (proof instanceof File && proof.size > 0) await storeProof(result.userId, proof);

  // TODO: notify the admin review queue for manual-route companies.

  return { ok: true, userId: result.userId, email, route };
}

async function storeProof(userId: string, file: File) {
  const extensions: Record<string, string> = { "application/pdf": "pdf", "image/png": "png" };
  const extension = extensions[file.type] ?? "jpg";
  const path = `${userId}/proof.${extension}`;

  try {
    const admin = createAdminClient();
    const upload = await admin.storage
      .from("company-proofs")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upload.error) throw upload.error;

    const update = await admin.from("companies").update({ proof_path: path }).eq("id", userId);
    if (update.error) throw update.error;
  } catch (error) {
    console.error("Company proof upload failed", error);
  }
}
