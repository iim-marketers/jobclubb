import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CircleCheck,
  MapPin,
  Pencil,
  UserRoundSearch,
} from "lucide-react";

import { Panel } from "@/components/candidate/dashboard-ui";
import {
  ApplicantsTable,
  IdentityNotice,
} from "@/components/company/applicants-table";
import { JobOpenToggle } from "@/components/company/job-open-toggle";
import { JobStatusPill } from "@/components/company/job-status";
import { COMPANY_JOBS } from "@/components/company/nav";
import { Button } from "@/components/ui/button";
import {
  formatExperience,
  formatPostedDate,
  formatSalary,
  industryName,
  type JobStatus,
} from "@/lib/company-jobs";
import { cn } from "@/lib/utils";
import { listCompanyApplicants } from "@/server/applications/company";
import { requireCompany } from "@/server/auth/current-company";
import { getCompanyJob } from "@/server/companies/jobs";
import { sanitizeRichText } from "@/server/rich-text";

const STATUS_NOTES: Record<JobStatus, string> = {
  live: "This posting is live on the job board and accepting applications.",
  closed:
    "This posting is closed and no longer accepts applications. Reopen it to start hiring again.",
};

export async function generateMetadata({
  params,
}: PageProps<"/company/dashboard/jobs/[id]">) {
  const { id } = await params;
  const company = await requireCompany(`${COMPANY_JOBS}/${id}`);
  const job = await getCompanyJob(company.id, id);
  return { title: `${job?.designation ?? "Job posting"} — JobClubb` };
}

export default async function JobDetailPage({
  params,
  searchParams,
}: PageProps<"/company/dashboard/jobs/[id]">) {
  const [{ id }, { submitted }] = await Promise.all([params, searchParams]);
  const company = await requireCompany(`${COMPANY_JOBS}/${id}`);
  const job = await getCompanyJob(company.id, id);
  if (!job) notFound();

  const applicants = await listCompanyApplicants(company.id, job.id);
  const closed = job.status === "closed";

  return (
    <div className="space-y-6">
      <Link
        href={COMPANY_JOBS}
        className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All job postings
      </Link>

      {submitted === "1" && job.status === "live" && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-good/30 bg-good/8 p-4 text-sm"
        >
          <CircleCheck className="mt-0.5 size-4 flex-none text-good" />
          <p>
            <span className="font-head font-bold">Your posting is live.</span>{" "}
            Members can see it on the job board and apply right away.
          </p>
        </div>
      )}

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <div className="min-w-0 flex-1">
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
                <MapPin className="size-3.5" /> {job.city} {job.pincode}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" /> Posted{" "}
                {formatPostedDate(job.createdAt)}
              </span>
            </p>
          </div>
          <div className="flex flex-none flex-wrap gap-2">
            {!closed && (
              <Button
                variant="outline"
                className="font-head"
                nativeButton={false}
                render={<Link href={`${COMPANY_JOBS}/${job.id}/edit`} />}
              >
                <Pencil className="size-4" /> Edit
              </Button>
            )}
            <JobOpenToggle jobId={job.id} closed={closed} />
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-4">
          {[
            ["Salary", formatSalary(job)],
            ["Experience", formatExperience(job)],
            ["Type", `${job.jobType} · ${job.workMode}`],
            ["Openings", String(job.openings)],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 truncate font-head text-sm font-bold">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div
          className={cn(
            "mt-6 flex items-start gap-1.5 rounded-2xl p-4 text-sm",
            closed ? "bg-muted/70" : "bg-good/8",
          )}
        >
          <span
            className={cn(
              "mt-2 size-2 flex-none rounded-full",
              closed ? "bg-muted-foreground" : "bg-good",
            )}
          />
          <p className="leading-6">{STATUS_NOTES[job.status]}</p>
        </div>
      </section>

      <Panel
        title="Applicants"
        description={`${applicants.length} ${applicants.length === 1 ? "person has" : "people have"} applied`}
      >
        {applicants.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-6 text-center sm:flex-row sm:text-left">
            <span className="flex size-11 flex-none items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <UserRoundSearch className="size-5" />
            </span>
            <div>
              <p className="font-head font-bold">No applicants yet</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {closed
                  ? "Reopen this posting to accept applications again."
                  : "Members who apply will show up here with their skills and experience."}
              </p>
            </div>
          </div>
        ) : (
          <ApplicantsTable applicants={applicants} />
        )}
        <IdentityNotice className="mt-4" />
      </Panel>

      <Panel title="About the role">
        <div
          className="rich-text max-w-4xl text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{
            __html: sanitizeRichText(job.description),
          }}
        />
        <div className="mt-6 grid gap-6 border-t border-border pt-6 md:grid-cols-2 md:gap-10">
          <DetailList title="Responsibilities" items={job.responsibilities} />
          <DetailList title="Requirements" items={job.requirements} />
        </div>
        {job.benefits.length > 0 && (
          <div className="mt-6 border-t border-border pt-6">
            <p className="font-head text-sm font-bold">Benefits</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {job.benefits.map((b) => (
                <li
                  key={b}
                  className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>
    </div>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-head text-sm font-bold">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-6">
            <span className="mt-2.5 size-1.5 flex-none rounded-full bg-brand" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
