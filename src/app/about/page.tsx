import Link from "next/link";

import { PageHeader, PageShell, Section, SectionEyebrow } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { VERTICALS } from "@/lib/taxonomy";

export const metadata = {
  title: "About — JobClubb",
  description:
    "JobClubb.com is a dedicated recruitment portal where candidates apply directly for live openings.",
};

const STATS = [
  { value: "15,100+", label: "members placed across 14+ companies" },
  { value: "100%", label: "Verified employers" },
  { value: "3", label: "Guaranteed interviews" },
  { value: "7", label: "Sector verticals covered" },
];

const WHY = [
  "Direct application model — candidates apply straight to live openings, with no unnecessary intermediaries",
  "Built on Emporium's existing, deep employer relationships in Airlines, Hotels and Travel",
  "Sector-focused rather than generalist, ensuring relevant roles and relevant candidates",
  "A growing platform with a clear roadmap to expand into additional sectors over time",
  "Positioned at the intersection of two high-demand, high-turnover industries: aviation and hospitality",
];

export default function AboutPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="About JobClubb"
        title="Where talent meets opportunity"
        description="JobClubb.com is a dedicated recruitment portal where candidates apply directly for live openings — connecting the right candidates to live, verified openings, without the noise of generic job portals."
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-head text-xl font-bold tracking-tight text-brand">
              Our Mission
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              To offer the right business solutions in the most ethical, high-quality and
              superior way - integrating cost-efficient people, better processes and new
              technologies to connect talent with opportunity.
            </p>

            <h2 className="mt-8 font-head text-xl font-bold tracking-tight text-brand">
              Our Vision
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Where talent meets opportunity, we help job seekers find meaningful work and
              help businesses thrive.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 self-start">
            {STATS.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border bg-card p-6">
                <p className="font-head text-2xl font-extrabold tracking-tight text-brand">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="bg-card">
        <SectionEyebrow>Why JobClubb.com</SectionEyebrow>
        <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight">
          Purpose-built, not generalist
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {WHY.map((item, i) => (
            <li
              key={item}
              className="rounded-2xl border border-border bg-background p-6"
            >
              <span className="font-head text-sm font-extrabold text-brand/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 leading-7 text-muted-foreground">{item}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionEyebrow>Sectors &amp; roles we cover</SectionEyebrow>
        <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight">
          Three core sectors, seven verticals
        </h2>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
          Additional sectors are planned as JobClubb.com expands, building on the same
          model of sector focus backed by genuine employer relationships.
        </p>

        <div className="mt-8 space-y-6">
          {VERTICALS.map((v) => (
            <div key={v.slug} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="font-head text-lg font-bold tracking-tight text-brand">
                  {v.name}
                </h3>
                <span className="text-xs text-muted-foreground">{v.sector}</span>
              </div>
              <p className="mt-3 leading-7 text-muted-foreground">
                {v.roles.join(" • ")}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button
            className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href="/jobs" />}
          >
            Browse open roles
          </Button>
        </div>
      </Section>
    </PageShell>
  );
}
