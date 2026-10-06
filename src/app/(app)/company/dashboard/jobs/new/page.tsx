import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createJob } from "@/app/(app)/company/dashboard/jobs/actions";
import { DashboardHeader } from "@/components/candidate/dashboard-ui";
import { JobForm } from "@/components/company/job-form";
import { PostingGuide } from "@/components/company/posting-guide";
import { COMPANY_JOBS } from "@/components/company/nav";
import { jobFormDefaults } from "@/lib/company-jobs";
import { requireCompany } from "@/server/auth/current-company";

export const metadata = { title: "Post a job — JobClubb" };

export default async function NewJobPage() {
  const company = await requireCompany(`${COMPANY_JOBS}/new`);

  return (
    <div className="space-y-6">
      <Link
        href={COMPANY_JOBS}
        className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All job postings
      </Link>

      <DashboardHeader
        title="Post a job"
        description="Tell candidates what the role involves. Your posting goes live to members as soon as you publish it."
      />

      <PostingGuide />

      <JobForm
        action={createJob}
        defaults={jobFormDefaults(null, company)}
        submitLabel="Publish job"
        cancelHref={COMPANY_JOBS}
      />
    </div>
  );
}
