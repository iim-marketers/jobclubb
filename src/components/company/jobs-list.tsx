"use client";

import Link from "next/link";
import { useState } from "react";
import { Briefcase, ChevronRight, MapPin, Search, Users } from "lucide-react";

import { EmptyState } from "@/components/candidate/dashboard-ui";
import { COMPANY_JOBS } from "@/components/company/nav";
import { JobStatusPill } from "@/components/company/job-status";
import { Button } from "@/components/ui/button";
import {
  formatPostedDate,
  type CompanyJob,
  type JobStatus,
} from "@/lib/company-jobs";
import { cn } from "@/lib/utils";

const TABS: { key: "all" | JobStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "in_review", label: "In review" },
  { key: "closed", label: "Closed" },
];

export type JobListItem = CompanyJob & { applicants: number };

export function JobsList({ jobs }: { jobs: JobListItem[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const visible = jobs.filter(
    (j) =>
      (tab === "all" ||
        j.status === tab ||
        (tab === "closed" && j.status === "rejected")) &&
      (!q ||
        [j.designation, j.role, j.city].some((v) => v.toLowerCase().includes(q))),
  );

  return (
    <section aria-label="Your job postings" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filter job postings"
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
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex flex-none items-center gap-1.5 rounded-full px-3.5 py-1.5 font-head text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, role or city"
            aria-label="Search job postings"
            className="h-10 w-full rounded-full border border-border bg-card pr-4 pl-10 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-3 focus:ring-brand/15"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={
            jobs.length === 0
              ? "No job postings yet"
              : q
                ? "No matching postings"
                : "Nothing here"
          }
          action={
            q ? (
              <Button
                variant="outline"
                className="font-head"
                onClick={() => setQuery("")}
              >
                Clear search
              </Button>
            ) : jobs.length === 0 ? (
              <Button
                className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                nativeButton={false}
                render={<Link href={`${COMPANY_JOBS}/new`} />}
              >
                Post your first job
              </Button>
            ) : undefined
          }
        >
          {jobs.length === 0
            ? "Post an opening and our team will review it before it goes live to members."
            : q
              ? "Try a different title, role or city."
              : "No postings have this status right now."}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {visible.map((job) => (
            <li key={job.id}>
              <Link
                href={`${COMPANY_JOBS}/${job.id}`}
                className="group flex items-center gap-4 px-4 py-4 transition-colors outline-none hover:bg-muted/40 focus-visible:bg-muted/40 sm:px-5"
              >
                <span
                  className={cn(
                    "hidden size-10 flex-none items-center justify-center rounded-xl sm:flex",
                    job.status === "live"
                      ? "bg-good/12 text-good"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Briefcase className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-head font-bold group-hover:text-brand">
                      {job.designation}
                    </p>
                    <JobStatusPill status={job.status} />
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{job.role}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" /> {job.city}
                    </span>
                    <span>
                      {job.jobType} · {job.workMode}
                    </span>
                  </p>
                </div>
                <div className="hidden flex-none text-right md:block">
                  <p className="flex items-center justify-end gap-1.5 font-head text-sm font-bold">
                    <Users className="size-3.5 text-muted-foreground" />
                    {job.applicants}
                  </p>
                  <p className="text-xs text-muted-foreground">applicants</p>
                </div>
                <div className="hidden w-28 flex-none text-right lg:block">
                  <p className="text-sm">{formatPostedDate(job.createdAt)}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.openings} {job.openings === 1 ? "opening" : "openings"}
                  </p>
                </div>
                <ChevronRight className="size-4 flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
