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
import { ApplicantsTable, IdentityNotice } from "@/components/company/applicants-table";
import { COMPANY_HOME, COMPANY_JOBS } from "@/components/company/nav";
import { Button } from "@/components/ui/button";
import { listCompanyApplicants } from "@/server/applications/company";
import { requireCompany } from "@/server/auth/current-company";
import { listCompanyJobs } from "@/server/companies/jobs";

export const metadata = { title: "Applicants — JobClubb" };

export default async function ApplicantsPage() {
  const company = await requireCompany(`${COMPANY_HOME}/applicants`);
  const [jobs, applicants] = await Promise.all([
    listCompanyJobs(company.id),
    listCompanyApplicants(company.id),
  ]);
  const jobTitles = Object.fromEntries(jobs.map((j) => [j.id, j.designation]));
  const active = applicants.filter((a) => a.status === "active");
  const hasLive = jobs.some((j) => j.status === "live");

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Applicants"
        description="Everyone who has applied to your postings, matched on skills and experience."
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
      ) : (
        <ApplicantsTable applicants={applicants} jobTitles={jobTitles} />
      )}

      <IdentityNotice />
    </div>
  );
}
