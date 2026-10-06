import { cookies } from "next/headers";

import { SIDEBAR_COOKIE } from "@/components/candidate/candidate-shell";
import { CompanyShell } from "@/components/company/company-shell";
import { COMPANY_HOME } from "@/components/company/nav";
import { verticalName } from "@/lib/company-jobs";
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
        contactName: company.contact_name,
        email: company.email,
        sector: verticalName(company.sector),
        city: company.city,
        logoUrl: getCompanyLogoUrl(company.logo_path),
      }}
      defaultCollapsed={collapsed}
    >
      <main className="flex-1 px-4 py-4 pb-10 sm:px-6">
        <div className="mx-auto w-full max-w-384">{children}</div>
      </main>
    </CompanyShell>
  );
}
