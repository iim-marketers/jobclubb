import Link from "next/link";
import { Lock, SearchX } from "lucide-react";

import { JobCard } from "@/components/job-card";
import {
  ActiveFilters,
  JobFiltersPanel,
  JobFiltersSheet,
  JobSortSelect,
} from "@/components/job-filters";
import { Button } from "@/components/ui/button";
import { JOBS } from "@/lib/jobs-data";
import { parseJobQuery, searchJobs } from "@/lib/jobs-search";
import { CHECKOUT_PATH, getJobAccess } from "@/server/auth/current-candidate";

export const metadata = {
  title: "Jobs — JobClubb",
  description:
    "Live openings across Airlines, Hospitality and Travel & Tourism from verified employers.",
};

export default async function JobsPage({ searchParams }: PageProps<"/jobs">) {
  const access = await getJobAccess();
  const query = parseJobQuery(await searchParams, access.member);
  const jobs = searchJobs(JOBS, query, access.member);
  const unlock = access.signedIn
    ? { href: CHECKOUT_PATH, label: "Complete payment" }
    : { href: "/sign-up", label: "Join JobClubb" };

  return (
    <section className="px-4 pb-12 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden min-w-0 lg:sticky lg:top-18 lg:block lg:self-start lg:pt-6">
          <JobFiltersPanel query={query} member={access.member} />
        </aside>

        <div className="min-w-0">
          <div className="sticky top-16 z-10 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-18 lg:mx-0 lg:px-0 lg:pt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <h1 className="font-head text-xl font-extrabold tracking-tight sm:text-2xl">
                  Jobs
                </h1>
                <p className="truncate text-sm text-muted-foreground">
                  {jobs.length} {jobs.length === 1 ? "opening" : "openings"}
                </p>
              </div>
              <div className="flex flex-none items-center gap-2">
                <JobFiltersSheet query={query} member={access.member} />
                {access.member && <JobSortSelect query={query} />}
              </div>
            </div>
            <ActiveFilters query={query} />
          </div>

          {jobs.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {jobs.map((job) => (
                <li key={job.slug} className="min-w-0">
                  <JobCard job={job} locked={!access.member} />
                </li>
              ))}
            </ul>
          )}

          {!access.member && (
            <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
              <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-brand/10">
                <Lock className="size-4 text-brand" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-head font-bold tracking-tight">
                  See the full picture
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Members see the company, location and salary, filter openings,
                  and apply in one click.
                </p>
              </div>
              <Button
                className="w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark sm:w-auto"
                nativeButton={false}
                render={<Link href={unlock.href} />}
              >
                {unlock.label}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <SearchX className="mx-auto size-6 text-brand" />
      <p className="mt-3 font-head text-lg font-bold tracking-tight">
        No jobs match your search
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
        Try a broader role name or remove a filter.
      </p>
      <Button
        variant="outline"
        className="mt-5 font-head"
        nativeButton={false}
        render={<Link href="/jobs" />}
      >
        See all jobs
      </Button>
    </div>
  );
}
