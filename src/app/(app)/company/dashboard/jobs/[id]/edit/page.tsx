import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { updateJob } from "@/app/(app)/company/dashboard/jobs/actions";
import { DashboardHeader } from "@/components/candidate/dashboard-ui";
import { JobForm } from "@/components/company/job-form";
import { PostingGuide } from "@/components/company/posting-guide";
import { COMPANY_JOBS } from "@/components/company/nav";
import { jobFormDefaults } from "@/lib/company-jobs";
import { requireCompany } from "@/server/auth/current-company";
import { getCompanyJob } from "@/server/companies/jobs";

export const metadata = { title: "Edit job posting — JobClubb" };

export default async function EditJobPage({
  params,
}: PageProps<"/company/dashboard/jobs/[id]/edit">) {
  const { id } = await params;
  const company = await requireCompany(`${COMPANY_JOBS}/${id}/edit`);
  const job = await getCompanyJob(company.id, id);
  if (!job) notFound();
  const jobHref = `${COMPANY_JOBS}/${job.id}`;
  if (job.status === "closed") redirect(jobHref);

  return (
    <div className="space-y-6">
      <Link
        href={jobHref}
        className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to posting
      </Link>

      <DashboardHeader
        title={`Edit ${job.designation}`}
        description={
          job.status === "live"
            ? "Saving sends the posting back for review. It comes off the job board until it's approved again."
            : "Saving sends the posting back for review."
        }
      />

      <PostingGuide />

      <JobForm
        action={updateJob.bind(null, job.id)}
        defaults={jobFormDefaults(job, company)}
        submitLabel="Save and resubmit"
        cancelHref={jobHref}
      />
    </div>
  );
}
