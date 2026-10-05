import "server-only";

import { sendEmail } from "@/lib/email/mailer";
import { companyApprovedEmail } from "@/lib/email/templates/company-approved";
import { createAdminClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/server/auth/confirmation-email";

export const COMPANY_STATUSES = ["pending_email", "pending_review", "verified", "rejected"] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

export type CompanyDecision = "approve" | "reject" | "reopen";

export type AdminCompany = {
  id: string;
  companyName: string;
  propertyName: string | null;
  sector: string;
  size: string;
  website: string | null;
  gstin: string | null;
  city: string;
  pincode: string;
  contactName: string;
  designation: string;
  email: string;
  phone: string;
  verificationRoute: "email" | "manual";
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
      "id, company_name, property_name, sector, size, website, gstin, city, pincode, contact_name, designation, email, phone, verification_route, status, email_verified_at, proof_path, created_at",
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
    sector: c.sector,
    size: c.size,
    website: c.website,
    gstin: c.gstin,
    city: c.city,
    pincode: c.pincode,
    contactName: c.contact_name,
    designation: c.designation,
    email: c.email,
    phone: c.phone,
    verificationRoute: c.verification_route,
    status: c.status,
    emailVerifiedAt: c.email_verified_at,
    proofUrl: c.proof_path ? (proofUrls.get(c.proof_path) ?? null) : null,
    createdAt: c.created_at,
  }));
}

export async function decideCompany(
  id: string,
  decision: CompanyDecision,
): Promise<
  { ok: true; status: CompanyStatus; emailFailed?: boolean } | { ok: false; error: string }
> {
  const admin = createAdminClient();
  const { data: company } = await admin
    .from("companies")
    .select("status, email_verified_at, company_name, contact_name, email")
    .eq("id", id)
    .maybeSingle();
  if (!company) return { ok: false, error: "This company no longer exists." };

  const emailVerified = company.email_verified_at !== null;
  // A company can't sign in until Supabase confirms its email, so approving earlier
  // would show "verified" for an account that still can't log in.
  if (decision === "approve" && !emailVerified) {
    return { ok: false, error: "The company hasn't confirmed its email yet." };
  }

  const status: CompanyStatus =
    decision === "approve"
      ? "verified"
      : decision === "reject"
        ? "rejected"
        : emailVerified
          ? "pending_review"
          : "pending_email";

  const { error } = await admin.from("companies").update({ status }).eq("id", id);
  if (error) return { ok: false, error: "Couldn't update the company. Please try again." };

  if (status === "verified" && company.status !== "verified") {
    try {
      await sendEmail({
        to: company.email,
        ...companyApprovedEmail({
          firstName: company.contact_name.split(" ")[0],
          companyName: company.company_name,
          email: company.email,
          signInUrl: `${SITE_URL}/sign-in?as=company`,
          siteUrl: SITE_URL,
        }),
      });
    } catch (sendError) {
      console.error("Sending company approval email failed", sendError);
      return { ok: true, status, emailFailed: true };
    }
  }

  return { ok: true, status };
}
