import Link from "next/link";
import { Briefcase, Hourglass, Plus, Radio, Users } from "lucide-react";

import { DashboardHeader, StatTile } from "@/components/candidate/dashboard-ui";
import { JobsList } from "@/components/company/jobs-list";
import { COMPANY_JOBS } from "@/components/company/nav";
import { Button } from "@/components/ui/button";
import { applicantsFor } from "@/lib/company-activity";
import { requireCompany } from "@/server/auth/current-company";
import { listCompanyJobs } from "@/server/companies/jobs";

export const metadata = { title: "Job postings — JobClubb" };

export default async function JobPostingsPage() {
  const company = await requireCompany(COMPANY_JOBS);
  const jobs = await listCompanyJobs(company.id);
  const live = jobs.filter((j) => j.status === "live");

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Job postings"
        description="Every opening you've posted, its review status and who has applied."
        action={
          <Button
            className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href={`${COMPANY_JOBS}/new`} />}
          >
            <Plus className="size-4" />
            Post a job
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Live"
          value={live.length}
          note="Visible to members"
          icon={Radio}
          tone="good"
        />
        <StatTile
          label="In review"
          value={jobs.filter((j) => j.status === "in_review").length}
          note="Waiting on JobClubb"
          icon={Hourglass}
        />
        <StatTile
          label="Open positions"
          value={live.reduce((n, j) => n + j.openings, 0)}
          note="Across live postings"
          icon={Briefcase}
        />
        <StatTile
          label="Total postings"
          value={jobs.length}
          note="Including closed"
          icon={Users}
          tone="muted"
        />
      </div>

      <JobsList
        jobs={jobs.map((j) => ({ ...j, applicants: applicantsFor(j.id).length }))}
      />
    </div>
  );
}
