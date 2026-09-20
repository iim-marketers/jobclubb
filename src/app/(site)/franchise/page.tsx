import Link from "next/link";
import { Check } from "lucide-react";

import { PageHeader, Section, SectionEyebrow } from "@/components/page-shell";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Franchise — JobClubb",
  description:
    "Build a job placement and recruitment business in your area with a proven model, training and lifelong support.",
};

const STEPS = [
  {
    step: "01",
    title: "Apply & partner up",
    body: "Complete the application and, once approved, secure the rights to your territory.",
  },
  {
    step: "02",
    title: "Get trained",
    body: "No recruitment experience needed - we train you across operations, marketing and best practice.",
  },
  {
    step: "03",
    title: "Launch your business",
    body: "Go live with ready-made marketing tools and a full platform to attract seekers and employers.",
  },
  {
    step: "04",
    title: "Grow with support",
    body: "Earn from placements, memberships and upskilling - with lifelong mentoring behind you.",
  },
];

const PARTNER_OFFER = [
  {
    area: "Employer Network",
    detail:
      "Access to Emporium's existing, deep employer relationships across Airlines, Hotels and Travel — live openings, not cold outreach.",
  },
  {
    area: "Platform & Technology",
    detail:
      "Use of the JobClubb.com portal for candidates to apply directly to live openings, with backend visibility into applications and hiring status.",
  },
  {
    area: "Sector Expertise",
    detail:
      "Recruitment guidance rooted in real understanding of Airlines, Hospitality and Travel & Tourism hiring — not generic staffing.",
  },
  {
    area: "Candidate Pipeline",
    detail:
      "A growing pool of candidates actively applying through JobClubb.com, reducing time and cost of sourcing.",
  },
  {
    area: "Brand Credibility",
    detail:
      "The backing of Emporium's established name and reputation in the travel and hospitality space.",
  },
  {
    area: "Growth Roadmap",
    detail:
      "Early access as the platform expands into additional sectors beyond Airlines, Hotels and Travel.",
  },
];

const NATIONAL_TRENDS = [
  "Passenger numbers are hitting record highs as travel rebounds post-pandemic",
  "The government's aviation infrastructure roadmap is ambitious in scale",
  "A growing middle class is bringing 600 million people into the workforce",
  "New service delivery models are emerging through digital transformation",
  "Indian carriers are expanding into international markets, opening up global prospects",
];

const TIER_TRENDS = [
  "Less competition means more room to capture market share",
  "Government-backed connectivity initiatives are opening up these regions",
  "Youth in smaller cities are increasingly aspirational in their outlook",
  "Operating costs run lower, even as fee structures stay competitive",
  "These markets remain largely untapped, with awareness of aviation steadily rising",
];

export default function FranchisePage() {
  return (
    <>
      <PageHeader
        eyebrow="Partner with us"
        title="Join our franchise program"
        description="Become our partner and build a successful job placement & recruitment business in your area - with a proven model, full training, and lifelong support."
      >
        <Button
          className="mt-7 bg-brand font-head text-brand-foreground hover:bg-brand-dark"
          nativeButton={false}
          render={<Link href="/franchise/apply" />}
        >
          Become a partner
        </Button>
      </PageHeader>

      <Section>
        <div className="overflow-hidden rounded-3xl border border-brand/25 bg-card">
          <div className="grid gap-5 p-5 sm:gap-8 sm:p-8 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-12 lg:p-10">
            <div>
              <SectionEyebrow>Revenue model</SectionEyebrow>
              <h2 className="mt-2 font-head text-xl font-extrabold tracking-tight sm:mt-3 sm:text-3xl">
                50% share of profit on every successful placement
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:mt-3 sm:text-base sm:leading-7">
                Franchise partners earn a share of profit from the
                candidate&apos;s first month salary, collected on successful
                placement — alongside earnings from memberships and upskilling.
              </p>
            </div>

            <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl bg-linear-to-br from-brand-surface to-brand-surface-strong px-5 py-4 text-white lg:flex-col lg:px-8 lg:py-8 lg:text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-white/10 blur-2xl"
              />
              <p className="font-head text-4xl leading-none font-extrabold tracking-tight lg:text-6xl">
                50%
              </p>
              <div className="lg:mt-5 lg:border-t lg:border-white/20 lg:pt-5">
                <p className="font-head text-[0.7rem] font-bold tracking-[0.14em] text-white/70 uppercase">
                  Partner share
                </p>
                <p className="mt-1 text-sm leading-5 text-white/80 sm:leading-6">
                  of profit on the candidate&apos;s first month salary
                </p>
              </div>
            </div>
          </div>
          {/* 
          <div className="grid gap-px border-t border-border bg-border sm:grid-cols-3">
            {REVENUE_STREAMS.map((stream) => (
              <div
                key={stream.label}
                className="flex items-start gap-3 bg-card p-5 sm:block sm:p-6"
              >
                <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <stream.icon className="size-4.5" />
                </span>
                <div className="sm:mt-3">
                  <h3 className="font-head text-sm font-bold tracking-tight">
                    {stream.label}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {stream.detail}
                  </p>
                </div>
              </div>
            ))}
          </div> */}
        </div>
      </Section>

      <Section className="bg-card">
        <SectionEyebrow>Getting started</SectionEyebrow>
        <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight">
          Four steps to launch
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item) => (
            <li
              key={item.step}
              className="rounded-2xl border border-border bg-background p-6"
            >
              <span className="font-head text-3xl font-extrabold text-brand/25">
                {item.step}
              </span>
              <h3 className="mt-3 font-head font-bold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <SectionEyebrow>What we offer our partners</SectionEyebrow>
        <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight">
          Structured support, built on Emporium&apos;s experience
        </h2>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-130 text-left">
            <thead className="bg-brand-surface text-brand-foreground">
              <tr>
                <th className="px-4 py-4 font-head text-sm font-bold sm:px-6">
                  Area
                </th>
                <th className="px-4 py-4 font-head text-sm font-bold sm:px-6">
                  What partners receive
                </th>
              </tr>
            </thead>
            <tbody>
              {PARTNER_OFFER.map((row, i) => (
                <tr
                  key={row.area}
                  className={i % 2 ? "bg-card" : "bg-muted/40"}
                >
                  <td className="px-4 py-4 align-top font-head text-sm font-bold text-brand sm:px-6">
                    {row.area}
                  </td>
                  <td className="px-4 py-4 text-sm leading-6 text-muted-foreground sm:px-6">
                    {row.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section className="bg-card">
        <SectionEyebrow>Why this opportunity, why now</SectionEyebrow>
        <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight">
          A rare window for franchise growth
        </h2>
        <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
          Airlines, hospitality and travel are among the fastest-recovering and
          highest-turnover employment sectors, with consistent, year-round
          hiring demand.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <TrendList title="National trends" items={NATIONAL_TRENDS} />
          <TrendList title="Tier 2 & Tier 3 cities" items={TIER_TRENDS} />
        </div>
      </Section>
    </>
  );
}

function TrendList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4 lg:p-6">
      <h3 className="font-head font-bold tracking-tight">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm">
            <Check className="mt-1 size-4 flex-none text-good" />
            <span className="leading-6 text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
