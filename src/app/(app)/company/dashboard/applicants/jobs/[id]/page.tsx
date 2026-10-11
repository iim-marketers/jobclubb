import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  ListChecks,
  MapPin,
  Send,
  UserRoundSearch,
  Users,
} from "lucide-react";

import { EmptyState, StatTile } from "@/components/candidate/dashboard-ui";
import {
  ApplicantsTable,
  IdentityNotice,
} from "@/components/company/applicants-table";
import { JobStatusPill } from "@/components/company/job-status";
import {
  COMPANY_APPLICANTS,
  COMPANY_JOBS,
  jobApplicantsHref,
} from "@/components/company/nav";
import { Button } from "@/components/ui/button";
import { formatPostedDate, industryName } from "@/lib/company-jobs";
import { listCompanyApplicants } from "@/server/applications/company";
import { requireCompany } from "@/server/auth/current-company";
import { getCompanyJob } from "@/server/companies/jobs";

export async function generateMetadata({
  params,
}: PageProps<"/company/dashboard/applicants/jobs/[id]">) {
  const { id } = await params;
  const company = await requireCompany(jobApplicantsHref(id));
  const job = await getCompanyJob(company.id, id);
  return {
    title: `${job ? `${job.designation} applicants` : "Applicants"} — JobClubb`,
  };
}

export default async function JobApplicantsPage({
  params,
}: PageProps<"/company/dashboard/applicants/jobs/[id]">) {
  const { id } = await params;
  const company = await requireCompany(jobApplicantsHref(id));
  const job = await getCompanyJob(company.id, id);
  if (!job) notFound();

  const applicants = await listCompanyApplicants(company.id, job.id);
  const active = applicants.filter((a) => a.status === "active");
  const closed = job.status === "closed";

  return (
    <div className="space-y-6">
      <Link
        href={COMPANY_APPLICANTS}
        className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All jobs
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <JobStatusPill status={job.status} />
            <span className="font-head text-xs font-semibold text-muted-foreground">
              {industryName(job.industry)} · {job.role}
            </span>
          </div>
          <h1 className="mt-2 font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
            {job.designation}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {job.city}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3.5" /> Posted{" "}
              {formatPostedDate(job.createdAt)}
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          className="flex-none font-head"
          nativeButton={false}
          render={<Link href={`${COMPANY_JOBS}/${job.id}`} />}
        >
          View posting <ArrowUpRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Applicants"
          value={applicants.length}
          note="For this posting"
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
        <EmptyState icon={UserRoundSearch} title="No applicants yet">
          {closed
            ? "Reopen this posting to accept applications again."
            : "Members who apply will show up here with their skills and experience."}
        </EmptyState>
      ) : (
        <ApplicantsTable applicants={applicants} />
      )}

      <IdentityNotice />
    </div>
  );
}
