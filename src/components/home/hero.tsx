import Form from "next/form";
import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  MapPin,
  Search,
  Shield,
  Users,
} from "lucide-react";

import { CompanyAvatar } from "@/components/company-avatar";
import { HIDDEN } from "@/components/home/shared";
import { Salary } from "@/components/salary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HERO_STATS } from "@/lib/home-data";
import type { JobListing } from "@/lib/jobs-data";
import { cn } from "@/lib/utils";

const STAT_ICONS = {
  shield: Shield,
  check: CheckCircle2,
  chart: BarChart3,
  users: Users,
} as const;

const FRESH_SLOTS = 3;

export function Hero({
  jobs,
  locked,
}: {
  jobs: JobListing[];
  locked: boolean;
}) {
  return (
    <section
      data-overlay-hero
      className="relative isolate -mt-16.25 flex min-h-svh flex-col overflow-hidden bg-[#0b1723] bg-[url(/hero/hero-poster.jpg)] bg-cover bg-center pt-16.25 lg:-mt-18.25 lg:pt-18.25"
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/hero/hero-poster.jpg"
        aria-hidden
        className="absolute inset-0 -z-10 size-full object-cover motion-reduce:hidden"
      >
        <source src="/hero/hero-reel.mp4" type="video/mp4" />
      </video>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-black/70 lg:bg-transparent lg:bg-linear-to-r lg:from-black/85 lg:via-black/65 lg:to-black/40"
      />

      <div className="flex flex-1 items-center px-4 pt-4 pb-12 sm:px-6 md:py-12 lg:pt-6 lg:pb-16">
        <div className="mx-auto grid w-full grid-cols-1 max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="min-w-0">
            <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm text-white/90 backdrop-blur-sm">
              3 guaranteed interviews for members
            </span>

            <h1 className="mt-0 md:mt-5 font-head text-4xl leading-[1.05] font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your career in{" "}
              <span className="text-brand-accent">airlines &amp; hotels</span>{" "}
              starts here.
            </h1>

            <span className="mt-5 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm text-white/90 backdrop-blur-sm md:hidden">
              3 guaranteed interviews for members
            </span>

            <p className="mt-5 max-w-lg text-base leading-7 text-white/80 sm:text-lg">
              5 lakh+ live jobs from verified employers. Get matched, upskill,
              and land the role that&apos;s right for you.
            </p>

            <Form
              action="/jobs"
              className="mt-7 flex max-w-xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-md sm:flex-row"
            >
              <div className="relative flex-1 border-b border-border sm:border-b-0 -mx-2 px-2">
                <Search className="pointer-events-none absolute top-5.5 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  aria-label="Role"
                  placeholder="Search jobs by role"
                  className="h-11 border-0 bg-transparent pl-8 shadow-none focus-visible:ring-0"
                />
              </div>
              <Button
                type="submit"
                className="h-11 bg-brand px-6 my-0.5 font-head text-brand-foreground hover:bg-brand-dark"
              >
                Search Jobs
              </Button>
            </Form>

            <p className="mt-4 flex items-start gap-1 text-sm text-white/85">
              <MapPin className="mt-0.5 size-4 flex-none text-brand-accent" />
              Find jobs near your location, matched to your pincode.
            </p>
          </div>

          <div className="min-w-0 rounded-3xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="font-head text-lg font-bold tracking-tight">
                Fresh today
              </h2>
              <span className="flex items-center gap-2 text-sm font-medium text-good">
                <span className="size-2 animate-pulse rounded-full bg-good" />
                Live
              </span>
            </div>

            <ul className="mt-4 space-y-3">
              {jobs.slice(0, FRESH_SLOTS).map((job) => (
                <li
                  key={job.slug}
                  className="relative flex items-center gap-3 rounded-2xl border border-border p-3 transition-colors hover:border-brand/40"
                >
                  {locked ? (
                    <span
                      aria-hidden
                      className={cn(
                        "size-10 flex-none rounded-full bg-muted",
                        HIDDEN,
                      )}
                    />
                  ) : (
                    <CompanyAvatar
                      name={job.company}
                      logoUrl={job.companyLogoUrl}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/jobs/${job.slug}`}
                      className="block truncate font-head text-sm font-bold after:absolute after:inset-0 after:rounded-2xl"
                    >
                      {job.title}
                    </Link>
                    <p
                      aria-hidden={locked}
                      className={cn(
                        "truncate text-xs text-muted-foreground",
                        locked && HIDDEN,
                      )}
                    >
                      {locked
                        ? "Company name · City"
                        : `${job.company} · ${job.location}`}
                    </p>
                  </div>
                  <span
                    aria-hidden={locked}
                    className={cn(
                      "font-head text-sm font-bold text-brand",
                      locked && HIDDEN,
                    )}
                  >
                    {locked ? "₹0L" : <Salary value={maxSalary(job)} />}
                  </span>
                </li>
              ))}
              {Array.from(
                { length: Math.max(0, FRESH_SLOTS - jobs.length) },
                (_, i) => (
                  <li
                    key={`soon-${i}`}
                    className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-3"
                  >
                    <span className="flex size-10 flex-none items-center justify-center rounded-full bg-muted">
                      <BriefcaseBusiness className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-head text-sm font-bold text-muted-foreground">
                        New role coming soon
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Verified employers are hiring
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 font-head text-[11px] font-bold text-muted-foreground">
                      Soon
                    </span>
                  </li>
                ),
              )}
            </ul>

            <Link
              href="/jobs"
              className="mt-4 block text-center text-sm text-muted-foreground hover:text-brand"
            >
              {jobs.length > 0
                ? "and many more inside"
                : "Browse the job board"}
            </Link>
          </div>
        </div>
      </div>

      <StatsStrip />
    </section>
  );
}

function StatsStrip() {
  return (
    <div className="border-t border-white/15 bg-black/30 py-5 text-white backdrop-blur-md sm:px-6">
      <div className="overflow-hidden sm:hidden">
        <div
          className="jc-marquee flex w-max gap-10"
          style={{ animationDuration: "20s" }}
        >
          {[...HERO_STATS, ...HERO_STATS].map((stat, i) => (
            <StatItem
              key={`${stat.label}-${i}`}
              stat={stat}
              aria-hidden={i >= HERO_STATS.length || undefined}
            />
          ))}
        </div>
      </div>
      <div className="mx-auto hidden max-w-6xl gap-x-8 gap-y-5 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {HERO_STATS.map((stat) => (
          <StatItem key={stat.label} stat={stat} />
        ))}
      </div>
    </div>
  );
}

function StatItem({
  stat,
  ...props
}: {
  stat: (typeof HERO_STATS)[number];
} & React.HTMLAttributes<HTMLDivElement>) {
  const Icon = STAT_ICONS[stat.icon];
  return (
    <div className="flex flex-none items-center gap-3" {...props}>
      <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-white/10 text-brand-accent">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="font-head text-lg leading-tight font-extrabold tracking-tight">
          {stat.value}
        </p>
        <p className="text-sm whitespace-nowrap text-white/70">{stat.label}</p>
      </div>
    </div>
  );
}

function maxSalary(job: JobListing) {
  return job.salaryRange.split(" – ").pop() ?? job.salaryRange;
}
