import { Lock, LogOut, Trash2 } from "lucide-react";

import { changeCompanyPassword } from "@/app/(app)/company/dashboard/settings/actions";
import { DashboardHeader, Panel } from "@/components/candidate/dashboard-ui";
import { PasswordForm } from "@/components/candidate/settings-forms";
import { COMPANY_SIGN_OUT_DESCRIPTION } from "@/components/company/company-sidebar";
import { COMPANY_HOME } from "@/components/company/nav";
import {
  CompanyDetailsForm,
  CompanySettingsNav,
  ContactForm,
  LogoForm,
  type CompanyDefaults,
} from "@/components/company/settings-forms";
import { SignOutDialog } from "@/components/sign-out-dialog";
import { Button } from "@/components/ui/button";
import { COMPANY_SIZES } from "@/lib/company-verification";
import { cn } from "@/lib/utils";
import { requireCompany } from "@/server/auth/current-company";
import { getCompanyLogoUrl } from "@/server/companies/logo";

export const metadata = { title: "Settings — JobClubb" };

export default async function CompanySettingsPage() {
  const company = await requireCompany(`${COMPANY_HOME}/settings`);
  const defaults: CompanyDefaults = {
    propertyName: company.property_name ?? "",
    sector: company.sector,
    city: company.city,
    pincode: company.pincode,
    contactName: company.contact_name,
    designation: company.designation,
    phone: company.phone,
  };

  const verified = [
    ["Company name", company.company_name],
    ["Sign-in email", company.email],
    ["Website", company.website ?? "—"],
    ["GSTIN", company.gstin ?? "—"],
    [
      "Company size",
      COMPANY_SIZES.find((s) => s.value === company.size)?.label ?? company.size,
    ],
    [
      "Verified by",
      company.verification_route === "email"
        ? "Corporate email"
        : "JobClubb review",
    ],
  ];

  const changeRequest = `mailto:contact@jobclubb.com?subject=${encodeURIComponent(
    `Update verified details for ${company.company_name}`,
  )}&body=${encodeURIComponent(
    `Account: ${company.email}\n\nPlease change the following details:\n`,
  )}`;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Settings"
        description="Manage your company profile, contact person and sign-in details."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,52rem)] xl:gap-8">
        <CompanySettingsNav />

        <div className="min-w-0 space-y-6">
          <LogoForm
            companyName={company.company_name}
            logoUrl={getCompanyLogoUrl(company.logo_path)}
          />

          <Panel
            id="verified"
            title="Verified details"
            description="Checked when we approved your account, so only our team can change them."
            action={
              <Button
                variant="outline"
                size="sm"
                className="flex-none font-head"
                nativeButton={false}
                render={<a href={changeRequest} />}
              >
                Request a change
              </Button>
            }
          >
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {verified.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="size-3" />
                    {label}
                  </dt>
                  <dd className="mt-0.5 truncate text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <CompanyDetailsForm defaults={defaults} />
          <ContactForm defaults={defaults} />
          <PasswordForm
            action={changeCompanyPassword}
            description="Choose a new password for this property's JobClubb login."
          />

          <Panel
            id="account"
            title="Account"
            description="Session and account controls."
          >
            <ul className="-mx-5 divide-y divide-border">
              <AccountRow
                title="Sign out"
                description={`You're signed in as ${company.email}.`}
                className="px-5 pb-5"
              >
                <SignOutDialog
                  description={COMPANY_SIGN_OUT_DESCRIPTION}
                  render={
                    <Button
                      variant="outline"
                      className="h-10 w-full font-head sm:w-44"
                    />
                  }
                >
                  <LogOut className="size-4" /> Sign out
                </SignOutDialog>
              </AccountRow>
              <AccountRow
                title="Close account"
                description="Remove this property, its job postings and applicant history. Our team will confirm with you before anything is deleted."
                destructive
                className="px-5 pt-4"
              >
                <Button
                  variant="destructive"
                  className="h-10 w-full font-head sm:w-44"
                  nativeButton={false}
                  render={
                    <a
                      href={`mailto:contact@jobclubb.com?subject=${encodeURIComponent(
                        "Close my JobClubb company account",
                      )}&body=${encodeURIComponent(
                        `Please close the company account registered to ${company.email}.`,
                      )}`}
                    />
                  }
                >
                  <Trash2 className="size-4" /> Request closure
                </Button>
              </AccountRow>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function AccountRow({
  title,
  description,
  destructive,
  className,
  children,
}: {
  title: string;
  description: string;
  destructive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "font-head text-sm font-bold",
            destructive && "text-destructive",
          )}
        >
          {title}
        </p>
        <p className="mt-0.5 max-w-md text-sm wrap-break-word text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex-none">{children}</div>
    </li>
  );
}
