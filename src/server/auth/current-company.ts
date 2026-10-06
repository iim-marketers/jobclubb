import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { getCompanyLogoUrl } from "@/server/companies/logo";

export const getCurrentCompany = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;

  const { data: company } = await supabase
    .from("companies")
    .select(
      "id, company_name, property_name, sector, size, website, gstin, city, pincode, contact_name, designation, email, phone, verification_route, status, logo_path, created_at",
    )
    .eq("id", userId)
    .maybeSingle();

  // Admins can reject a company after it signed in; that ends dashboard access.
  return company?.status === "verified" ? company : null;
});

export type CurrentCompany = NonNullable<Awaited<ReturnType<typeof getCurrentCompany>>>;

export const getCompanySession = cache(async () => {
  const company = await getCurrentCompany();
  if (!company) return null;
  return {
    name: company.property_name ?? company.company_name,
    email: company.email,
    logoUrl: getCompanyLogoUrl(company.logo_path),
  };
});

export async function requireCompany(returnTo: string) {
  const company = await getCurrentCompany();
  if (!company) redirect(`/sign-in?as=company&next=${encodeURIComponent(returnTo)}`);
  return company;
}

export async function redirectIfCompany() {
  if (await getCurrentCompany()) redirect("/company/dashboard");
}
