import Link from "next/link";
import { Briefcase, BriefcaseBusiness, Lock, MapPin } from "lucide-react";

import { CompanyAvatar } from "@/components/company-avatar";
import { HIDDEN } from "@/components/home/shared";
import { SectionEyebrow } from "@/components/page-shell";
import { Salary } from "@/components/salary";
import { Button } from "@/components/ui/button";
import { JOB_FILTERS } from "@/lib/home-data";
import type { JobListing } from "@/lib/jobs-data";
import { cn } from "@/lib/utils";

export function FeaturedOpenings({
  jobs,
  locked,
}: {
  jobs: JobListing[];
  locked: boolean;
}) {
  const featured = jobs.slice(0, 6);
  const ghosts = jobs.length
    ? Array.from({ length: 4 }, (_, i) => jobs[i % jobs.length])
    : [];

  return (
    <section className="bg-card px-4 py-12 md:py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow>Featured openings</SectionEyebrow>
        <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight sm:text-4xl">
          Jobs actively hiring now
        </h2>

        <div className="jc-hscroll -mx-4 mt-6 flex gap-2 overflow-x-auto overscroll-x-contain px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {JOB_FILTERS.map((filter, i) => (
            <button
              key={filter}
              type="button"
              aria-pressed={i === 0}
              className="flex-none rounded-full border border-border px-4 py-2 font-head text-sm font-semibold whitespace-nowrap transition-colors aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-brand-foreground"
            >
              {filter}
            </button>
          ))}
        </div>

        {featured.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-border bg-background px-6 py-14 text-center">
            <BriefcaseBusiness className="mx-auto size-6 text-brand" />
            <h3 className="mt-3 font-head text-lg font-bold tracking-tight">
              No openings right now
            </h3>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
              Verified employers post new roles every week. Check back soon.
            </p>
          </div>
        ) : (
          <div className="jc-hscroll -mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:snap-none lg:scroll-px-0 lg:grid-cols-2 lg:overflow-visible lg:px-0 lg:pb-0">
            {featured.map((job) => (
              <JobCard
                key={job.slug}
                job={job}
                locked={locked}
                className="w-[84%] flex-none snap-start bg-background sm:w-[60%] md:w-[46%] lg:w-auto"
              />
            ))}
          </div>
        )}

        {featured.length === 0 ? null : locked ? (
          <div className="relative mt-4 overflow-hidden rounded-3xl border border-border bg-background">
            <div
              aria-hidden
              inert
              className="grid grid-cols-1 max-h-96 gap-4 overflow-hidden p-5 blur-[6px] select-none lg:max-h-none lg:grid-cols-2"
            >
              {ghosts.map((job, i) => (
                <JobCard
                  key={`ghost-${i}`}
                  job={job}
                  locked
                  className="bg-background"
                />
              ))}
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 px-6 text-center backdrop-blur-[2px]">
              <span className="flex size-14.5 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-lg">
                <Lock className="size-6" />
              </span>
              <h3 className="mt-4 font-head text-xl font-bold tracking-tight">
                Many more jobs inside
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Membership unlocks the full job board, one-click apply, and
                priority support with hiring employers.
              </p>
              <Button
                className="mt-5 bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                nativeButton={false}
                render={<Link href="/membership" />}
              >
                Become a Member to unlock
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

const PLACEHOLDER = {
  company: "Company name",
  location: "City",
  jobType: "Job type",
  industry: "Category",
  salaryRange: "₹0 LPA – 0 LPA",
  postedAgo: "Recently",
};

function JobCard({
  job,
  locked,
  className,
}: {
  job: JobListing;
  locked: boolean;
  className?: string;
}) {
  const shown = locked ? PLACEHOLDER : job;
  const hidden = locked ? HIDDEN : undefined;

  return (
    <article
      className={cn(
        "group relative min-w-0 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {locked ? (
          <span
            aria-hidden
            className={cn("size-10 flex-none rounded-full bg-muted", HIDDEN)}
          />
        ) : (
          <CompanyAvatar name={job.company} logoUrl={job.companyLogoUrl} />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-head font-bold tracking-tight transition-colors group-hover:text-brand">
            <Link
              href={`/jobs/${job.slug}`}
              className="after:absolute after:inset-0 after:rounded-2xl"
            >
              {job.title}
            </Link>
          </h3>
          <p
            aria-hidden={locked}
            className={cn("truncate text-sm text-muted-foreground", hidden)}
          >
            {shown.company}
          </p>
        </div>
        {!locked && job.featured && (
          <span className="flex-none rounded-full bg-brand-accent/15 px-2.5 py-1 font-head text-[10px] font-bold tracking-wide text-good uppercase">
            Featured
          </span>
        )}
      </div>

      <ul
        aria-hidden={locked}
        className={cn("mt-4 flex flex-wrap gap-2", hidden)}
      >
        <MetaPill icon={MapPin}>{shown.location}</MetaPill>
        <MetaPill icon={Briefcase}>{shown.jobType}</MetaPill>
        <MetaPill>{shown.industry}</MetaPill>
      </ul>

      <div
        aria-hidden={locked}
        className="mt-4 -mx-5 px-5 flex items-center justify-between border-t border-border pt-4"
      >
        <span className={cn("font-head text-sm font-bold text-brand", hidden)}>
          <Salary value={shown.salaryRange} />
        </span>
        <span className={cn("text-xs text-muted-foreground", hidden)}>
          Posted {shown.postedAgo.toLowerCase()}
        </span>
      </div>
    </article>
  );
}

function MetaPill({
  icon: Icon,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
      {Icon && <Icon className="size-3" />}
      {children}
    </li>
  );
}
