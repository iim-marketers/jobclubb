import Link from "next/link";
import {
  CalendarCheck,
  ListChecks,
  Send,
  UserRoundSearch,
  Users,
} from "lucide-react";

import {
  DashboardHeader,
  EmptyState,
  StatTile,
} from "@/components/candidate/dashboard-ui";
import {
  ApplicantJobsList,
  type ApplicantJob,
} from "@/components/company/applicant-jobs-list";
import { ApplicantsTable, IdentityNotice } from "@/components/company/applicants-table";
import { COMPANY_APPLICANTS, COMPANY_JOBS } from "@/components/company/nav";
import { Button } from "@/components/ui/button";
import type { Applicant } from "@/lib/company-activity";
import { cn } from "@/lib/utils";
import { listCompanyApplicants } from "@/server/applications/company";
import { requireCompany } from "@/server/auth/current-company";
import { listCompanyJobs } from "@/server/companies/jobs";

export const metadata = { title: "Applicants — JobClubb" };

const VIEWS = [
  { key: "jobs", label: "By job", href: COMPANY_APPLICANTS },
  { key: "all", label: "All applicants", href: `${COMPANY_APPLICANTS}?view=all` },
] as const;

export default async function ApplicantsPage({
  searchParams,
}: PageProps<"/company/dashboard/applicants">) {
  const view = (await searchParams).view === "all" ? "all" : "jobs";
  const company = await requireCompany(COMPANY_APPLICANTS);
  const [jobs, applicants] = await Promise.all([
    listCompanyJobs(company.id),
    listCompanyApplicants(company.id),
  ]);
  const active = applicants.filter((a) => a.status === "active");
  const hasLive = jobs.some((j) => j.status === "live");

  const applicantJobs: ApplicantJob[] = jobs
    .map((j) => ({
      id: j.id,
      designation: j.designation,
      role: j.role,
      city: j.city,
      status: j.status,
      ...jobCounts(applicants.filter((a) => a.jobId === j.id)),
    }))
    .filter((j) => j.status === "live" || j.total > 0)
    .sort(
      (a, b) =>
        Number(b.fresh > 0) - Number(a.fresh > 0) ||
        Number(b.status === "live") - Number(a.status === "live") ||
        (b.lastAppliedOn ?? "").localeCompare(a.lastAppliedOn ?? ""),
    );

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Applicants"
        description="Everyone who has applied to your postings, matched on skills and experience."
        action={
          applicants.length > 0 && (
            <nav
              aria-label="Applicant views"
              className="flex gap-1 rounded-full border border-border bg-card p-1"
            >
              {VIEWS.map((v) => (
                <Link
                  key={v.key}
                  href={v.href}
                  aria-current={view === v.key ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 font-head text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    view === v.key
                      ? "bg-brand text-brand-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {v.label}
                </Link>
              ))}
            </nav>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Total applicants"
          value={applicants.length}
          note="Across all postings"
          icon={Users}
        />
        <StatTile
          label="New"
          value={active.filter((a) => a.stage === 0).length}
          note="Not yet reviewed"
          icon={Send}
        />
        <StatTile
          label="Shortlisted"
          value={active.filter((a) => a.stage === 2).length}
          note="Ready for interview"
          icon={ListChecks}
          tone="good"
        />
        <StatTile
          label="Interviewing"
          value={active.filter((a) => a.stage >= 3).length}
          note="Interview or offer stage"
          icon={CalendarCheck}
          tone="muted"
        />
      </div>

      {applicants.length === 0 ? (
        <EmptyState
          icon={UserRoundSearch}
          title="No applicants yet"
          action={
            <Button
              className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
              nativeButton={false}
              render={<Link href={hasLive ? COMPANY_JOBS : `${COMPANY_JOBS}/new`} />}
            >
              {hasLive ? "View job postings" : "Post a job"}
            </Button>
          }
        >
          {hasLive
            ? "Members who apply to your live postings will show up here."
            : "Once you post a job, members who apply will show up here."}
        </EmptyState>
      ) : view === "all" ? (
        <ApplicantsTable
          applicants={applicants}
          jobTitles={Object.fromEntries(jobs.map((j) => [j.id, j.designation]))}
        />
      ) : (
        <ApplicantJobsList jobs={applicantJobs} />
      )}

      <IdentityNotice />
    </div>
  );
}

function jobCounts(applicants: Applicant[]) {
  const active = applicants.filter((a) => a.status === "active");
  return {
    lastAppliedOn: applicants[0]?.appliedOn ?? null,
    total: applicants.length,
    fresh: active.filter((a) => a.stage === 0).length,
    shortlisted: active.filter((a) => a.stage >= 2).length,
    rejected: applicants.length - active.length,
  };
}
