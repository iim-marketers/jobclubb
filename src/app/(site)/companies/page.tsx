import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";

import { CompanyAvatar } from "@/components/company-avatar";
import { PageHeader, Section } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { EMPLOYER_DIRECTORY, VERTICALS } from "@/lib/taxonomy";

export const metadata = {
  title: "Companies — JobClubb",
  description: "Verified employers hiring across Airlines, Hospitality and Travel & Tourism.",
};

export default function CompaniesPage() {
  const groups = ["Airlines", "Hotels", "Cruise Lines", "Travel & Tourism"];

  return (
    <>
      <PageHeader
        eyebrow="Verified employers"
        title="Companies hiring on JobClubb"
        description="Built on Emporium's existing employer relationships across Airlines, Hotels and Travel — live openings, not cold outreach."
      />

      <Section>
        {groups.map((group) => {
          const companies = EMPLOYER_DIRECTORY.filter((c) => c.vertical === group);
          if (!companies.length) return null;
          return (
            <div key={group} className="mb-12 last:mb-0">
              <div className="flex items-center gap-3">
                <h2 className="font-head text-2xl font-extrabold tracking-tight">
                  {group}
                </h2>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {companies.length} employers
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {companies.map((company) => (
                  <div
                    key={company.name}
                    className="group flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand"
                  >
                    <CompanyAvatar name={company.name} className="size-11" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-head font-bold tracking-tight transition-colors group-hover:text-brand">
                        {company.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {company.openRoles} open roles
                      </p>
                    </div>
                    <ShieldCheck className="size-4 flex-none text-good" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Section>

      <Section className="bg-card">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Building2 className="size-6 text-brand" />
            <h2 className="mt-3 font-head text-3xl font-extrabold tracking-tight">
              Hiring for your team?
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Post openings and review candidates by skills and experience. Candidate
              identity stays private until you choose to unlock it — so you assess on
              capability first.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                nativeButton={false}
                render={<Link href="/sign-up/company" />}
              >
                Register your company
              </Button>
              <Button
                variant="outline"
                className="font-head"
                nativeButton={false}
                render={<Link href="/sign-in?as=company" />}
              >
                Sign in to post a job
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-background p-7">
            <h3 className="font-head font-bold tracking-tight">Sectors we cover</h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {VERTICALS.map((v) => (
                <li key={v.slug} className="text-sm">
                  <span className="font-head font-semibold">{v.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {v.roles.length} role types
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}
