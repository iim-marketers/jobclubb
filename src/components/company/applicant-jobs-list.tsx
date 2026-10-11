"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Briefcase, ChevronLeft, ChevronRight, Search } from "lucide-react";

import { EmptyState } from "@/components/candidate/dashboard-ui";
import { JobStatusPill } from "@/components/company/job-status";
import { jobApplicantsHref } from "@/components/company/nav";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/candidate-activity";
import type { JobStatus } from "@/lib/company-jobs";
import { cn } from "@/lib/utils";

export type ApplicantJob = {
  id: string;
  designation: string;
  role: string;
  city: string;
  status: JobStatus;
  lastAppliedOn: string | null;
  total: number;
  fresh: number;
  shortlisted: number;
  rejected: number;
};

const PAGE_SIZE = 10;

const TABS = [
  { key: "all", label: "All" },
  { key: "new", label: "Has new" },
  { key: "live", label: "Live" },
  { key: "closed", label: "Closed" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function inTab(job: ApplicantJob, tab: TabKey) {
  if (tab === "new") return job.fresh > 0;
  if (tab === "live" || tab === "closed") return job.status === tab;
  return true;
}

const COUNTS = [
  { key: "total", label: "Applicants" },
  { key: "fresh", label: "New" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "rejected", label: "Not selected" },
] as const;

const ROW_GRID =
  "grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-[minmax(0,1fr)_repeat(4,6rem)_1rem] sm:items-center sm:gap-x-3";

export function ApplicantJobsList({ jobs }: { jobs: ApplicantJob[] }) {
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter(
      (j) =>
        inTab(j, tab) &&
        (!q ||
          `${j.designation} ${j.role} ${j.city}`.toLowerCase().includes(q)),
    );
  }, [jobs, tab, query]);

  const pageCount = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, filtered.length);

  return (
    <section aria-label="Applicants by job" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filter jobs"
          className="flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1"
        >
          {TABS.map((t) => {
            const selected = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setTab(t.key);
                  setPage(0);
                }}
                className={cn(
                  "flex flex-none items-center gap-1.5 rounded-full px-3.5 py-1.5 font-head text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] font-bold tabular-nums",
                    selected ? "bg-white/20" : "bg-muted",
                  )}
                >
                  {jobs.filter((j) => inTab(j, t.key)).length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search title, role or city"
            aria-label="Search jobs"
            className="h-10 w-full rounded-full border border-border bg-card pr-4 pl-10 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-3 focus:ring-brand/15"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={query ? "No matching jobs" : "No jobs here"}
          action={
            query ? (
              <Button
                variant="outline"
                className="font-head"
                onClick={() => setQuery("")}
              >
                Clear search
              </Button>
            ) : undefined
          }
        >
          {query
            ? "Try a different title, role or city."
            : "Jobs matching this filter will show up here."}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div
            aria-hidden
            className={cn(
              ROW_GRID,
              "hidden border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold text-muted-foreground sm:grid",
            )}
          >
            <span>Job</span>
            {COUNTS.map((c) => (
              <span key={c.key} className="text-center">
                {c.label}
              </span>
            ))}
          </div>
          <ul className="divide-y divide-border">
            {rows.map((job) => (
              <li key={job.id}>
                <Link
                  href={jobApplicantsHref(job.id)}
                  className={cn(
                    ROW_GRID,
                    "group px-4 py-4 transition-colors outline-none hover:bg-muted/40 focus-visible:bg-muted/40 sm:px-5",
                  )}
                >
                  <div className="col-span-4 min-w-0 sm:col-span-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate font-head font-bold group-hover:text-brand">
                        {job.designation}
                      </p>
                      <JobStatusPill status={job.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {job.city}
                      {job.lastAppliedOn &&
                        ` · Last applied ${formatShortDate(job.lastAppliedOn)}`}
                    </p>
                  </div>
                  {COUNTS.map((c) => {
                    const value = job[c.key];
                    return (
                      <div
                        key={c.key}
                        className="rounded-xl bg-muted/50 px-2 py-1.5 text-center sm:bg-transparent sm:p-0"
                      >
                        <p
                          className={cn(
                            "font-head font-bold tabular-nums",
                            value === 0 || c.key === "rejected"
                              ? "text-muted-foreground"
                              : c.key === "fresh"
                                ? "text-brand"
                                : c.key === "shortlisted" && "text-good",
                          )}
                        >
                          {value}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground sm:hidden">
                          {c.label}
                        </p>
                      </div>
                    );
                  })}
                  <ChevronRight className="hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand sm:block" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
            <p className="text-xs text-muted-foreground">
              Showing {from}–{to} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous page"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next page"
                disabled={page >= pageCount - 1}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
