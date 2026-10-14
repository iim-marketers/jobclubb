import "server-only";

import { createAdminClient } from "@/lib/supabase/server";

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
  city: string;
  pincode: string;
  contactName: string;
  designation: string;
  email: string;
  phone: string;
  status: CompanyStatus;
  emailVerifiedAt: string | null;
  proofUrl: string | null;
  createdAt: string;
};

const PROOF_URL_TTL = 60 * 60;

export async function listCompanies(): Promise<AdminCompany[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("companies")
    .select(
      "id, company_name, property_name, industry, size, website, gstin, city, pincode, contact_name, designation, email, phone, status, email_verified_at, proof_path, created_at",
    )
    .order("created_at", { ascending: false });
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
    emailVerifiedAt: c.email_verified_at,
    proofUrl: c.proof_path ? (proofUrls.get(c.proof_path) ?? null) : null,
    createdAt: c.created_at,
  }));
}
