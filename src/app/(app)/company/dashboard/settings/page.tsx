import { LogOut, Trash2 } from "lucide-react";

import {
  changeCompanyPassword,
  deleteCompanyAccount,
} from "@/app/(app)/company/dashboard/settings/actions";
import { DashboardHeader, Panel } from "@/components/candidate/dashboard-ui";
import { PasswordForm } from "@/components/candidate/settings-forms";
import { COMPANY_SIGN_OUT_DESCRIPTION } from "@/components/company/company-sidebar";
import { COMPANY_HOME } from "@/components/company/nav";
import {
  CompanyDetailsForm,
  CompanySettingsNav,
  ContactForm,
  LogoForm,
  VerifiedDetails,
  type CompanyDefaults,
  type VerifiedItem,
} from "@/components/company/settings-forms";
import { CompanyAvatar } from "@/components/company-avatar";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { SignOutDialog } from "@/components/sign-out-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { countWalkInsAwayFrom } from "@/server/applications/company";
import { requireCompany } from "@/server/auth/current-company";
import { listPendingChanges } from "@/server/companies/change-requests";
import { getCompanyLogoUrl } from "@/server/companies/logo";

export const metadata = { title: "Settings — JobClubb" };

export default async function CompanySettingsPage() {
  const company = await requireCompany(`${COMPANY_HOME}/settings`);
  const defaults: CompanyDefaults = {
    propertyName: company.property_name ?? "",
    industry: company.industry,
    size: company.size,
    website: company.website ?? "",
    pincode: company.pincode,
    contactName: company.contact_name,
    designation: company.designation,
    phone: company.phone,
  };

  const verified: VerifiedItem[] = [
    { label: "Company name", value: company.company_name, field: "company_name" },
    { label: "Property city", value: company.city, field: "city" },
    { label: "Sign-in email", value: company.email },
    { label: "GSTIN", value: company.gstin ?? "—", field: "gstin" },
    {
      label: "Verified by",
      value:
        company.verification_route === "email"
          ? "Corporate email"
          : "JobClubb review",
    },
  ];
  const pending = await listPendingChanges(company.id);
  const logoUrl = getCompanyLogoUrl(company.logo_path);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Settings"
        description="Manage your company profile, contact person and sign-in details."
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,52rem)] xl:gap-8">
        <CompanySettingsNav />

        <div className="min-w-0 space-y-6">
          <LogoForm
            companyName={company.company_name}
            logoUrl={logoUrl}
          />

          <VerifiedDetails
            items={verified}
            current={{
              company_name: company.company_name,
              city: company.city,
              gstin: company.gstin,
            }}
            pending={pending.map(({ id, field, newValue }) => ({
              id,
              field,
              newValue,
            }))}
          />

          <CompanyDetailsForm
            defaults={defaults}
            city={company.city}
            walkInsElsewhere={await countWalkInsAwayFrom(company.id, company.pincode)}
          />
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
                title="Delete account"
                description="Permanently delete this property, its job postings and applicant history. This can't be undone."
                destructive
                className="px-5 pt-4"
              >
                <DeleteAccountDialog
                  action={deleteCompanyAccount}
                  avatar={
                    <CompanyAvatar
                      name={company.property_name ?? company.company_name}
                      logoUrl={logoUrl}
                      className="size-14 text-base"
                    />
                  }
                  name={company.property_name ?? company.company_name}
                  email={company.email}
                  description="This property, its job postings, applicants, interviews and placements will be permanently deleted. This can't be undone."
                  render={
                    <Button
                      variant="destructive"
                      className="h-10 w-full font-head sm:w-44"
                    />
                  }
                >
                  <Trash2 className="size-4" /> Delete account
                </DeleteAccountDialog>
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
