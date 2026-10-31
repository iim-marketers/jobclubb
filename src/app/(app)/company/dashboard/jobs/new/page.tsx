import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createJob } from "@/app/(app)/company/dashboard/jobs/actions";
import { DashboardHeader } from "@/components/candidate/dashboard-ui";
import { JobForm } from "@/components/company/job-form";
import { PostingGuide } from "@/components/company/posting-guide";
import { COMPANY_JOBS } from "@/components/company/nav";
import { jobFormDefaults } from "@/lib/company-jobs";
import { requireCompany } from "@/server/auth/current-company";
import { getCompanyJob } from "@/server/companies/jobs";

export const metadata = { title: "Post a job — JobClubb" };

export default async function NewJobPage({
  searchParams,
}: PageProps<"/company/dashboard/jobs/new">) {
  const company = await requireCompany(`${COMPANY_JOBS}/new`);
  const { from } = await searchParams;
  const source =
    company.is_partner && typeof from === "string"
      ? await getCompanyJob(company.id, from)
      : null;

  return (
    <div className="space-y-6">
      <Link
        href={COMPANY_JOBS}
        className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All job postings
      </Link>

      <DashboardHeader
        title={source ? `Duplicate ${source.designation}` : "Post a job"}
        description={
          source
            ? `Everything is copied from the ${source.city} posting. Add the city for this one and publish it as a separate job.`
            : "Tell candidates what the role involves. Your posting goes live to members as soon as you publish it."
        }
      />

      <PostingGuide />

      <JobForm
        action={createJob}
        defaults={
          source
            ? { ...jobFormDefaults(source, company), city: "", pincode: "" }
            : jobFormDefaults(null, company)
        }
        location={company.is_partner ? null : company}
        submitLabel="Publish job"
        cancelHref={COMPANY_JOBS}
      />
    </div>
  );
}
