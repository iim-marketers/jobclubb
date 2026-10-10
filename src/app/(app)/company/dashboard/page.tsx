import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  ListChecks,
  MapPin,
  Plus,
  Radio,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";

import { EmptyState, Panel, StatTile } from "@/components/candidate/dashboard-ui";
import { CompanyAvatar } from "@/components/company-avatar";
import { IdentityNotice } from "@/components/company/applicants-table";
import { JobStatusPill } from "@/components/company/job-status";
import { COMPANY_HOME, COMPANY_JOBS } from "@/components/company/nav";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatInterviewDate,
  formatInterviewTime,
} from "@/lib/candidate-activity";
import {
  STAGES,
  upcomingCompanyInterviews,
  type CompanyInterview,
} from "@/lib/company-activity";
import { industryName, type CompanyJob } from "@/lib/company-jobs";
import { greeting } from "@/lib/greeting";
import { cn } from "@/lib/utils";
import { listCompanyApplicants } from "@/server/applications/company";
import { requireCompany } from "@/server/auth/current-company";
import { listCompanyJobs } from "@/server/companies/jobs";
import { getCompanyLogoUrl } from "@/server/companies/logo";

export const metadata = { title: "Company dashboard — JobClubb" };

export default async function CompanyDashboard() {
  const company = await requireCompany(COMPANY_HOME);
  const [jobs, applicants] = await Promise.all([
    listCompanyJobs(company.id),
    listCompanyApplicants(company.id),
  ]);
  const now = new Date();

  const active = applicants.filter((a) => a.status === "active");
  const live = jobs.filter((j) => j.status === "live");
  const upcoming = upcomingCompanyInterviews(now);
  const weekAhead = upcoming.filter(
    (i) => +new Date(i.startsAt) - +now < 7 * 86_400_000,
  ).length;
  const applicantCount = (jobId: string) =>
    applicants.filter((a) => a.jobId === jobId).length;

  const checklist = [
    { label: "Get your company verified", done: true },
    { label: "Post your first job", done: jobs.length > 0 },
    { label: "Receive your first applicant", done: applicants.length > 0 },
    { label: "Schedule an interview", done: upcoming.length > 0 || active.some((a) => a.stage >= 3) },
  ];

  const stats = [
    {
      label: "Live postings",
      value: live.length,
      note: "Visible to members",
      icon: Radio,
      tone: "good" as const,
    },
    {
      label: "Applicants",
      value: applicants.length,
      note: `${active.filter((a) => a.stage === 0).length} not yet reviewed`,
      icon: Users,
      tone: "brand" as const,
    },
    {
      label: "Shortlisted",
      value: active.filter((a) => a.stage === 2).length,
      note: "Ready for interview",
      icon: ListChecks,
      tone: "brand" as const,
    },
    {
      label: "Interviews",
      value: weekAhead,
      note: "In the next 7 days",
      icon: CalendarClock,
      tone: "muted" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
            {greeting(now)}, {company.contact_name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {jobs.length === 0 ? (
              "Post your first opening to start receiving applicants."
            ) : (
              <>
                You have{" "}
                <span className="font-semibold text-foreground">
                  {live.length} live {live.length === 1 ? "posting" : "postings"}
                </span>{" "}
                and{" "}
                <span className="font-semibold text-foreground">
                  {applicants.length}{" "}
                  {applicants.length === 1 ? "applicant" : "applicants"}
                </span>{" "}
                so far.
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="font-head"
            nativeButton={false}
            render={<Link href={`${COMPANY_HOME}/applicants`} />}
          >
            <Users className="size-4" />
            Applicants
          </Button>
          <Button
            className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href={`${COMPANY_JOBS}/new`} />}
          >
            <Plus className="size-4" />
            Post a job
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <CompanySummary
          companyName={company.company_name}
          logoUrl={getCompanyLogoUrl(company.logo_path)}
          propertyName={company.property_name}
          sector={industryName(company.industry)}
          city={company.city}
          hiringFor={[...new Set(live.map((j) => j.designation))].slice(0, 5)}
          nextInterview={upcoming[0]}
        />
        <GettingStarted checklist={checklist} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <RecentPostings jobs={jobs.slice(0, 5)} applicantCount={applicantCount} />

        <Panel
          title="Hiring pipeline"
          description="Active applicants by stage"
          action={
            <Link
              href={`${COMPANY_HOME}/applicants`}
              className="inline-flex flex-none items-center gap-1 font-head text-sm font-bold text-brand hover:text-brand-dark"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          }
        >
          <ul className="space-y-3.5">
            {STAGES.map((stage, i) => {
              const count = active.filter((a) => a.stage === i).length;
              const share = active.length ? count / active.length : 0;
              return (
                <li key={stage}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">{stage}</span>
                    <span className="font-head font-bold">{count}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        i >= 3 ? "bg-good" : "bg-brand",
                      )}
                      style={{ width: `${share * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <IdentityNotice className="mt-5" />
        </Panel>
      </div>
    </div>
  );
}

function CompanySummary({
  companyName,
  logoUrl,
  propertyName,
  sector,
  city,
  hiringFor,
  nextInterview,
}: {
  companyName: string;
  logoUrl: string | null;
  propertyName: string | null;
  sector: string;
  city: string;
  hiringFor: string[];
  nextInterview?: CompanyInterview;
}) {
  return (
    <section
      aria-label="Your company"
      className="flex min-w-0 flex-col gap-6 rounded-3xl bg-linear-to-br from-brand-surface to-brand-surface-strong p-6 text-white sm:p-7 md:flex-row md:items-stretch"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-4">
          <CompanyAvatar
            name={companyName}
            logoUrl={logoUrl}
            className="size-14 rounded-2xl text-lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-head text-xl font-extrabold tracking-tight">
                {companyName}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 font-head text-[11px] font-bold">
                <ShieldCheck className="size-3" /> Verified
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/75">
              {propertyName && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-3.5" /> {propertyName}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Briefcase className="size-3.5" /> {sector}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" /> {city}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <p className="text-xs font-medium text-white/70">Hiring for</p>
          {hiringFor.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {hiringFor.map((title) => (
                <li
                  key={title}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium"
                >
                  {title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-sm text-white/80">
              No live postings yet. Approved postings show up here.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white/10 p-5 md:w-64 md:flex-none">
        <div>
          <p className="text-xs font-medium text-white/70">Next interview</p>
          {nextInterview ? (
            <>
              <p className="mt-1.5 font-head text-lg font-bold tracking-tight">
                {nextInterview.designation}
              </p>
              <p className="font-mono text-sm text-white/80">
                {nextInterview.applicantRef}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-white/75">
                <CalendarClock className="size-3.5" />{" "}
                {formatInterviewDate(nextInterview.startsAt)} ·{" "}
                {formatInterviewTime(nextInterview.startsAt)}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-white/75">
                <Video className="size-3.5" /> {nextInterview.mode}
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-sm text-white/80">
              Nothing scheduled. Shortlist applicants to set up interviews.
            </p>
          )}
        </div>
        <Button
          size="sm"
          className="w-full bg-white font-head text-brand hover:bg-white/90"
          nativeButton={false}
          render={<Link href={`${COMPANY_HOME}/interviews`} />}
        >
          View interviews
        </Button>
      </div>
    </section>
  );
}

function GettingStarted({
  checklist,
}: {
  checklist: { label: string; done: boolean }[];
}) {
  const done = checklist.filter((c) => c.done).length;
  return (
    <section className="flex min-w-0 flex-col rounded-3xl border border-border bg-card p-6">
      <p className="font-head text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
        Getting started
      </p>
      <h2 className="mt-1 font-head text-lg font-bold tracking-tight">
        {done === checklist.length ? "You're all set" : "Your first hire"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {done} of {checklist.length} steps done
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand"
          style={{ width: `${(done / checklist.length) * 100}%` }}
        />
      </div>

      <ol className="mt-5 space-y-2.5">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-center gap-2.5 text-sm">
            <span
              className={cn(
                "flex size-5 flex-none items-center justify-center rounded-full",
                item.done
                  ? "bg-good/15 text-good"
                  : "border border-dashed border-muted-foreground/50",
              )}
            >
              {item.done && <Check className="size-3" strokeWidth={3} />}
            </span>
            <span
              className={cn(
                "truncate",
                item.done && "text-muted-foreground line-through",
              )}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RecentPostings({
  jobs,
  applicantCount,
}: {
  jobs: CompanyJob[];
  applicantCount: (jobId: string) => number;
}) {
  if (jobs.length === 0)
    return (
      <EmptyState
        icon={Briefcase}
        title="No job postings yet"
        action={
          <Button
            className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href={`${COMPANY_JOBS}/new`} />}
          >
            Post your first job
          </Button>
        }
      >
        Postings go live right away and are shown to members matched on
        sector and location.
      </EmptyState>
    );

  return (
    <Panel
      title="Recent postings"
      action={
        <Link
          href={COMPANY_JOBS}
          className="inline-flex flex-none items-center gap-1 font-head text-sm font-bold text-brand hover:text-brand-dark"
        >
          Manage <ArrowRight className="size-3.5" />
        </Link>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 pl-4 text-xs font-semibold text-muted-foreground">
                Job
              </TableHead>
              <TableHead className="h-10 px-3 text-xs font-semibold text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="h-10 px-3 text-right text-xs font-semibold text-muted-foreground">
                Applicants
              </TableHead>
              <TableHead className="h-10 w-10 pr-4">
                <span className="sr-only">Open</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id} className="group/row relative">
                <TableCell className="max-w-0 min-w-48 py-3 pl-4">
                  <Link
                    href={`${COMPANY_JOBS}/${job.id}`}
                    className="block truncate font-head font-bold after:absolute after:inset-0 group-hover/row:text-brand focus-visible:underline focus-visible:outline-none"
                  >
                    {job.designation}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {job.role}
                  </p>
                </TableCell>
                <TableCell className="px-3 py-3">
                  <JobStatusPill status={job.status} />
                </TableCell>
                <TableCell className="px-3 py-3 text-right font-head font-bold">
                  {applicantCount(job.id)}
                </TableCell>
                <TableCell className="w-10 py-3 pr-4">
                  <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-brand" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Panel>
  );
}
