import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BriefcaseBusiness, Lock, SearchX } from "lucide-react";

import { JobCard } from "@/components/job-card";
import {
  ActiveFilters,
  JobFiltersPanel,
  JobFiltersSheet,
  JobSortSelect,
} from "@/components/job-filters";
import { LoadMoreJobs } from "@/components/load-more-jobs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MAX_RESULTS,
  jobsHref,
  parseJobQuery,
  parsePaging,
  type JobQuery,
  type Paging,
} from "@/lib/jobs-search";
import { CHECKOUT_PATH } from "@/lib/membership";
import {
  getCurrentCandidate,
  getJobAccess,
} from "@/server/auth/current-candidate";
import { listSavedJobSlugs } from "@/server/candidates/saved-jobs";
import { jobFacetCounts, searchJobListings } from "@/server/jobs/listings";

export const metadata = {
  title: "Jobs — JobClubb",
  description:
    "Live openings across Airlines, Hospitality and Travel & Tourism from verified employers.",
  alternates: { canonical: "/jobs" },
};

const PREVIEW_LIMIT = 6;

export default async function JobsPage({ searchParams }: PageProps<"/jobs">) {
  const [access, params] = await Promise.all([getJobAccess(), searchParams]);
  const query = parseJobQuery(params, access.member);
  const paging = parsePaging(params);
  if (
    access.member &&
    (params.page !== String(paging.page) ||
      params.limit !== String(paging.limit))
  ) {
    const canonical = new URLSearchParams();
    for (const [key, value] of Object.entries(params))
      for (const v of [value ?? []].flat()) canonical.append(key, v);
    canonical.set("page", String(paging.page));
    canonical.set("limit", String(paging.limit));
    redirect(`/jobs?${canonical}`);
  }

  return (
    <Suspense fallback={<JobsSkeleton member={access.member} />}>
      <JobResults access={access} query={query} paging={paging} />
    </Suspense>
  );
}

async function JobResults({
  access,
  query,
  paging,
}: {
  access: Awaited<ReturnType<typeof getJobAccess>>;
  query: JobQuery;
  paging: Paging;
}) {
  const [{ jobs, total }, counts, savedSlugs] = await Promise.all([
    searchJobListings(
      query,
      access.member,
      access.member ? paging.page * paging.limit : PREVIEW_LIMIT,
    ),
    access.member ? jobFacetCounts(query) : undefined,
    access.member
      ? getCurrentCandidate().then((c) => (c ? listSavedJobSlugs(c.id) : []))
      : undefined,
  ]);
  const saved = savedSlugs && new Set(savedSlugs);
  const noOpenings = total === 0 && isBlank(query);
  const hasMore = access.member && jobs.length < total;
  const unlock = access.signedIn
    ? {
        href: CHECKOUT_PATH,
        label: access.expired ? "Renew membership" : "Complete payment",
      }
    : { href: "/sign-up", label: "Join JobClubb" };

  return (
    <section className="px-4 pb-12 sm:px-6">
      <div className="mx-auto grid grid-cols-1 max-w-6xl gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden min-w-0 lg:sticky lg:top-18 lg:block lg:self-start lg:pt-6">
          <JobFiltersPanel
            query={query}
            member={access.member}
            counts={counts}
          />
        </aside>

        <div className="min-w-0">
          <div className="sticky top-16 z-10 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-18 lg:mx-0 lg:px-0 lg:pt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <h1 className="font-head text-xl font-extrabold tracking-tight sm:text-2xl">
                  Jobs
                </h1>
              </div>
              <div className="flex flex-none items-center gap-2">
                <JobFiltersSheet
                  query={query}
                  member={access.member}
                  counts={counts}
                />
                {access.member && <JobSortSelect query={query} />}
              </div>
            </div>
            <ActiveFilters query={query} />
          </div>

          {noOpenings ? (
            <NoOpenings />
          ) : jobs.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {jobs.map((job) => (
                <li key={job.slug} className="min-w-0">
                  <JobCard
                    job={job}
                    locked={!access.member}
                    saved={saved?.has(job.slug)}
                  />
                </li>
              ))}
            </ul>
          )}

          {hasMore &&
            (paging.page < Math.floor(MAX_RESULTS / paging.limit) ? (
              <LoadMoreJobs
                href={jobsHref(query, { ...paging, page: paging.page + 1 })}
                shown={jobs.length}
                total={total}
              />
            ) : (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Showing the first {jobs.length.toLocaleString("en-IN")} of{" "}
                {total.toLocaleString("en-IN")} jobs. Add a filter to narrow
                them down.
              </p>
            ))}

          {access.member && !hasMore && total > paging.limit && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              You&apos;ve seen all {total.toLocaleString("en-IN")} jobs
            </p>
          )}

          {!access.member && !noOpenings && (
            <div className="mt-4 flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
              <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-brand/10">
                <Lock className="size-4 text-brand" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-head font-bold tracking-tight">
                  See the full picture
                </p>
                <p className="text-xs leading-6 text-muted-foreground">
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

function JobsSkeleton({ member }: { member: boolean }) {
  return (
    <section aria-busy className="px-4 pb-12 sm:px-6">
      <div className="mx-auto grid grid-cols-1 max-w-6xl gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block lg:pt-6">
          <div className="rounded-2xl border border-border bg-card">
            <div className="flex h-14 items-center border-b border-border px-5">
              <Skeleton className="h-4 w-20" />
            </div>
            {[5, 2, 3].map((rows, i) => (
              <div key={i} className="space-y-3 border-b border-border px-5 py-4 last:border-b-0">
                <Skeleton className="h-4 w-16" />
                {Array.from({ length: rows }, (_, j) => (
                  <Skeleton key={j} className="h-6 w-full" />
                ))}
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="-mx-4 flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:pt-6">
            <h1 className="font-head text-xl font-extrabold tracking-tight sm:text-2xl">
              Jobs
            </h1>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-10 rounded-lg lg:hidden" />
              {member && <Skeleton className="h-8 w-36 rounded-lg sm:w-45" />}
            </div>
          </div>

          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <li
                key={i}
                className="flex flex-col rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <Skeleton className="size-11 flex-none rounded-xl" />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3.5 w-2/5" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-3.5 w-4/5" />
                <Skeleton className="my-4 h-8 w-36 rounded-lg" />
                <div className="-mx-4 border-t border-border px-4 pt-4">
                  <Skeleton className="h-3.5 w-28" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function isBlank(query: JobQuery) {
  return (
    !query.q &&
    !query.loc &&
    !query.sectors.length &&
    !query.jobTypes.length &&
    !query.workModes.length
  );
}

function NoOpenings() {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <BriefcaseBusiness className="mx-auto size-6 text-brand" />
      <p className="mt-3 font-head text-lg font-bold tracking-tight">
        No openings right now
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
        Verified employers post new roles every week. Check back soon.
      </p>
    </div>
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
