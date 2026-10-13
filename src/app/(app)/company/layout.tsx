import { cookies } from "next/headers";

import { SIDEBAR_COOKIE } from "@/components/candidate/candidate-shell";
import { CompanyShell } from "@/components/company/company-shell";
import { COMPANY_HOME } from "@/components/company/nav";
import { TermsUpdateBanner } from "@/components/company/terms-update-banner";
import { industryName } from "@/lib/company-jobs";
import { EMPLOYER_TERMS_VERSION } from "@/lib/terms-content";
import { requireCompany } from "@/server/auth/current-company";
import { getCompanyLogoUrl } from "@/server/companies/logo";

export default async function CompanyLayout({
  children,
}: LayoutProps<"/company">) {
  const company = await requireCompany(COMPANY_HOME);
  const collapsed =
    (await cookies()).get(SIDEBAR_COOKIE)?.value === "collapsed";

  return (
    <CompanyShell
      company={{
        companyName: company.company_name,
        propertyName: company.property_name,
        email: company.email,
        sector: industryName(company.industry),
        city: company.city,
        logoUrl: getCompanyLogoUrl(company.logo_path),
      }}
      defaultCollapsed={collapsed}
    >
      <main className="flex-1 px-4 py-4 pb-10 sm:px-6">
        <div className="mx-auto w-full max-w-384">
          {company.terms_version !== EMPLOYER_TERMS_VERSION && <TermsUpdateBanner />}
          {children}
        </div>
      </main>
    </CompanyShell>
  );
}
