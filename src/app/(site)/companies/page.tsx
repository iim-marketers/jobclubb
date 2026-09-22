import Image from "next/image";
import Link from "next/link";
import { Building2 } from "lucide-react";

import { PageHeader, Section } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { VERTICALS } from "@/lib/taxonomy";
import { COMPANY_SECTORS, getCompanies } from "@/server/companies/directory";

export const metadata = {
  title: "Companies — JobClubb",
  description:
    "Verified employers hiring across Airlines, Hospitality and Travel & Tourism.",
};

const slug = (value: string) => value.toLowerCase().replace(/[^a-z]+/g, "-");

export default async function CompaniesPage() {
  const companies = await getCompanies();
  const sectors = COMPANY_SECTORS.map((sector) => ({
    ...sector,
    companies: companies.filter((c) => c.sector === sector.value),
  })).filter((sector) => sector.companies.length);

  return (
    <>
      <PageHeader
        eyebrow="Verified employers"
        title="Companies hiring on JobClubb"
        description="Built on Emporium's existing employer relationships across Airlines, Hotels and Travel — live openings, not cold outreach."
      >
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {sectors.map((sector) => (
            <a
              key={sector.value}
              href={`#${slug(sector.value)}`}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium transition-colors hover:border-brand hover:text-brand"
            >
              {sector.label}
              <span className="ml-1.5 text-muted-foreground">
                {sector.companies.length}
              </span>
            </a>
          ))}
        </div>
      </PageHeader>

      <Section>
        <div className="divide-y divide-border">
          {sectors.map((sector) => (
            <section
              key={sector.value}
              id={slug(sector.value)}
              className="scroll-mt-24 py-8 first:pt-0 last:pb-0"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-head text-lg font-extrabold tracking-tight sm:text-xl">
                  {sector.label}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {sector.companies.length}{" "}
                  {sector.companies.length === 1 ? "employer" : "employers"}
                </span>
              </div>

              <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {sector.companies.map((company) => (
                  <li
                    key={company.id}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
                  >
                    <div className="aspect-260/215 bg-white">
                      <Image
                        src={company.logo_path}
                        alt={`${company.name} logo`}
                        width={260}
                        height={215}
                        sizes="(min-width: 1024px) 170px, (min-width: 768px) 20vw, (min-width: 640px) 25vw, 33vw"
                        className="size-full object-contain p-2"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Section>

      <Section className="bg-card">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Building2 className="size-6 text-brand" />
            <h2 className="mt-3 font-head text-3xl font-extrabold tracking-tight">
              Hiring for your team?
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Post openings and review candidates by skills and experience.
              Candidate identity stays private until you choose to unlock it —
              so you assess on capability first.
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
            <h3 className="font-head font-bold tracking-tight">
              Sectors we cover
            </h3>
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
