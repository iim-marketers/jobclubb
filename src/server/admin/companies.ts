import "server-only";

import type { FieldErrors, PartnerCompanyInput } from "@/lib/sign-up-validation";
import { createAdminClient } from "@/lib/supabase/server";
import { EMPLOYER_TERMS_VERSION } from "@/lib/terms-content";
import { getCompanyLogoUrl, uploadCompanyLogo } from "@/server/companies/logo";
import { listPendingChanges, type ChangeRequest } from "@/server/companies/change-requests";

export const COMPANY_STATUSES = ["pending_email", "verified", "rejected"] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

export type AdminCompany = {
  id: string;
  companyName: string;
  propertyName: string | null;
  industry: string;
  size: string;
  website: string | null;
  gstin: string | null;
  city: string | null;
  pincode: string | null;
  contactName: string;
  designation: string | null;
  email: string;
  phone: string;
  status: CompanyStatus;
  isPartner: boolean;
  logoUrl: string | null;
  emailVerifiedAt: string | null;
  proofUrl: string | null;
  createdAt: string;
  pendingChanges: ChangeRequest[];
};

const PROOF_URL_TTL = 60 * 60;

export async function listCompanies(): Promise<AdminCompany[]> {
  const admin = createAdminClient();
  const [{ data, error }, pendingChanges] = await Promise.all([
    admin
      .from("companies")
      .select(
        "id, company_name, property_name, industry, size, website, gstin, city, pincode, contact_name, designation, email, phone, status, is_partner, logo_path, email_verified_at, proof_path, created_at",
      )
      .order("created_at", { ascending: false }),
    listPendingChanges(),
  ]);
  if (error) throw error;

  const proofPaths = data.flatMap((c) => (c.proof_path ? [c.proof_path] : []));
  const proofUrls = new Map<string, string>();
  if (proofPaths.length > 0) {
    const { data: signed } = await admin.storage
      .from("company-proofs")
      .createSignedUrls(proofPaths, PROOF_URL_TTL);
    signed?.forEach((s) => s.path && s.signedUrl && proofUrls.set(s.path, s.signedUrl));
  }

  return data.map((c) => ({
    id: c.id,
    companyName: c.company_name,
    propertyName: c.property_name,
    industry: c.industry,
    size: c.size,
    website: c.website,
    gstin: c.gstin,
    city: c.city,
    pincode: c.pincode,
    contactName: c.contact_name,
    designation: c.designation,
    email: c.email,
    phone: c.phone,
    status: c.status,
    isPartner: c.is_partner,
    logoUrl: getCompanyLogoUrl(c.logo_path),
    emailVerifiedAt: c.email_verified_at,
    proofUrl: c.proof_path ? (proofUrls.get(c.proof_path) ?? null) : null,
    createdAt: c.created_at,
    pendingChanges: pendingChanges.filter((r) => r.companyId === c.id),
  }));
}

export async function createPartnerCompany(
  input: PartnerCompanyInput,
  logo: File | null,
): Promise<{ ok: true; id: string } | { ok: false; errors: FieldErrors }> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      role: "company",
      company_name: input.companyName,
      industry: input.industry,
      size: input.size,
      website: input.website,
      gstin: input.gstin,
      city: input.city || undefined,
      pincode: input.pincode || undefined,
      contact_name: input.contactName,
      designation: input.designation || undefined,
      phone: input.phone,
      // The tie-up agreement is signed offline before the account is created.
      terms_version: EMPLOYER_TERMS_VERSION,
    },
  });
  if (error) {
    if (error.code === "email_exists" || error.code === "user_already_exists")
      return { ok: false, errors: { email: "An account with this email already exists." } };
    if (error.code === "weak_password")
      return { ok: false, errors: { password: "Choose a stronger password." } };
    throw error;
  }

  // Set here rather than from user metadata, which anyone signing up can write.
  const id = data.user.id;
  const { error: updateError } = await admin
    .from("companies")
    .update({
      is_partner: true,
      verification_route: "manual",
      status: "verified",
      email_verified_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) {
    await admin.auth.admin.deleteUser(id);
    throw updateError;
  }

  // The company can add a logo from settings, so a failed upload doesn't undo the account.
  if (logo) {
    try {
      const logoPath = await uploadCompanyLogo(id, logo, { asAdmin: true });
      const { error: logoError } = await admin
        .from("companies")
        .update({ logo_path: logoPath })
        .eq("id", id);
      if (logoError) throw logoError;
    } catch (error) {
      console.error("Uploading partner company logo failed", error);
    }
  }
  return { ok: true, id };
}
