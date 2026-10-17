import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  ClipboardCheck,
  Clock,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Plus,
  ShieldCheck,
  UserRoundSearch,
  Users,
  Zap,
} from "lucide-react";

import { Salary } from "@/components/salary";
import { EmptyState } from "@/components/candidate/dashboard-ui";
import { CompanyAvatar } from "@/components/company-avatar";
import { JobStatusPill } from "@/components/company/job-status";
import {
  COMPANY_APPLICANTS,
  COMPANY_HOME,
  COMPANY_JOBS,
  jobApplicantsHref,
} from "@/components/company/nav";
import { RecruiterBoard } from "@/components/recruiter-board";
import { SectionEyebrow } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { REFERRED_STAGE, formatShortDate } from "@/lib/candidate-activity";
import {
  STAGES,
  formatExperienceMonths,
  type Applicant,
} from "@/lib/company-activity";
import {
  formatExperience,
  formatSalary,
  industryName,
  type CompanyJob,
} from "@/lib/company-jobs";
import { greeting } from "@/lib/greeting";
import { stageBadge } from "@/lib/status-badge";
import { cn } from "@/lib/utils";
import { listCompanyApplicants } from "@/server/applications/company";
import type { CurrentCompany } from "@/server/auth/current-company";
import { listCompanyJobs } from "@/server/companies/jobs";
import { getCompanyLogoUrl } from "@/server/companies/logo";
import { getHireBrands } from "@/server/hire-brands/directory";
import { postedAgo } from "@/server/jobs/listings";

const SHOWN = 6;

const EMPLOYER_POINTS = [
  {
    icon: BadgeCheck,
    title: "Members only",
    body: "Every candidate is a verified JobClubb member who has committed to their job search.",
  },
  {
    icon: ClipboardCheck,
    title: "Pre-screened",
    body: "JobClubb screens and interviews every candidate before referring them to you.",
  },
  {
    icon: Zap,
    title: "Live instantly",
    body: "Postings reach members matched on sector and city the moment you publish.",
  },
  {
    icon: GraduationCap,
    title: "Interview-ready",
    body: "Members prepare with our coaching and certification programs before they meet you.",
  },
];

export async function CompanyHome({ company }: { company: CurrentCompany }) {
  const [jobs, applicants, brands] = await Promise.all([
    listCompanyJobs(company.id),
    listCompanyApplicants(company.id),
    getHireBrands(),
  ]);

  const active = applicants.filter((a) => a.status === "active");
  const unreviewed = active.filter((a) => a.stage === REFERRED_STAGE);
  const live = jobs.filter((j) => j.status === "live");
  const designations = new Map(jobs.map((j) => [j.id, j.designation]));
  const queue = (unreviewed.length ? unreviewed : applicants).slice(0, SHOWN);
  const postings = [...live, ...jobs.filter((j) => j.status !== "live")].slice(
    0,
    SHOWN,
  );
  const sector = industryName(company.industry);
  const name = company.property_name ?? company.company_name;

  return (
    <>
      <section className="jc-auth-panel relative isolate px-4 pt-8 pb-12 text-white sm:px-6 md:py-14">
        <div className="mx-auto grid grid-cols-1 max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/85 ring-1 ring-white/15">
              <span className="size-1.5 animate-pulse rounded-full bg-brand-accent" />
              {live.length} live {live.length === 1 ? "posting" : "postings"} on
              JobClubb
            </span>
            <h1 className="mt-5 font-head text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
              {greeting(new Date())},{" "}
              <span className="text-brand-accent">{name}</span>
            </h1>
            <p className="mt-3 max-w-lg text-base leading-7 text-white/75">
              Post roles, meet candidates JobClubb has screened for you and hire
              your next team member faster.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                className="h-11 bg-white px-6 font-head text-brand hover:bg-white/90"
                nativeButton={false}
                render={<Link href={`${COMPANY_JOBS}/new`} />}
              >
                <Plus className="size-4" />
                Post a job
              </Button>
              <Button
                variant="outline"
                className="h-11 border-white/40 bg-transparent px-6 font-head text-white hover:bg-white/10 hover:text-white"
                nativeButton={false}
                render={<Link href={COMPANY_APPLICANTS} />}
              >
                <UserRoundSearch className="size-4" />
                Review referrals
              </Button>
            </div>

            {live.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-white/70">Hiring for:</span>
                {live.slice(0, 5).map((job) => (
                  <Link
                    key={job.id}
                    href={jobApplicantsHref(job.id)}
                    className="rounded-full bg-white/10 px-3 py-1 font-head text-xs font-semibold ring-1 ring-white/20 transition-colors hover:bg-white hover:text-brand"
                  >
                    {job.designation}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <CompanyCard
            name={name}
            logoUrl={getCompanyLogoUrl(company.logo_path)}
            sector={sector}
            city={company.city}
            stats={[
              { label: "Live jobs", value: live.length },
              { label: "Referred", value: applicants.length },
              {
                label: "Interviewing",
                value: active.filter((a) => a.stage > REFERRED_STAGE).length,
              },
            ]}
            unreviewed={unreviewed.length}
          />
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow={unreviewed.length ? "Needs an interview" : "Referrals"}
            title={
              unreviewed.length
                ? "New referrals waiting on you"
                : "Latest referrals"
            }
            href={COMPANY_APPLICANTS}
            linkLabel="All referrals"
          />
          {queue.length === 0 ? (
            <div className="mt-6">
              <EmptyState icon={Users} title="No referrals yet">
                {live.length
                  ? "JobClubb is screening members for your postings and will refer the best fits here."
                  : "Post a job and JobClubb will refer screened, verified members to you."}
              </EmptyState>
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {queue.map((a) => (
                <ApplicantCard
                  key={a.ref}
                  applicant={a}
                  designation={designations.get(a.jobId)}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="border-y border-border bg-card px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Your postings"
            title="Track every opening"
            href={COMPANY_JOBS}
            linkLabel="Manage postings"
          />
          {postings.length === 0 ? (
            <div className="mt-6">
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
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {postings.map((job) => (
                <PostingCard
                  key={job.id}
                  job={job}
                  applicants={applicants.filter((a) => a.jobId === job.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow>Why hire on JobClubb</SectionEyebrow>
          <h2 className="mt-2 font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
            Talent that&apos;s ready to work
          </h2>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EMPLOYER_POINTS.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-head font-bold tracking-tight">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {brands.length > 0 && (
        <section className="border-t border-border bg-card px-4 py-12 sm:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="You're in good company"
              title="Brands hiring through JobClubb"
              href="/companies"
              linkLabel="All companies"
            />
            <div className="mt-6">
              <RecruiterBoard logos={brands.map((brand) => brand.logo_path)} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function CompanyCard({
  name,
  logoUrl,
  sector,
  city,
  stats,
  unreviewed,
}: {
  name: string;
  logoUrl: string | null;
  sector: string;
  city: string;
  stats: { label: string; value: number }[];
  unreviewed: number;
}) {
  return (
    <aside className="min-w-0 rounded-3xl bg-card p-5 text-foreground shadow-xl sm:p-6">
      <div className="flex items-center gap-3">
        <CompanyAvatar
          name={name}
          logoUrl={logoUrl}
          className="size-12 rounded-2xl text-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-head font-bold tracking-tight">{name}</p>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3 flex-none" />
            {sector} · {city}
          </p>
        </div>
        <span className="flex flex-none items-center gap-1 rounded-full bg-good/12 px-2.5 py-1 font-head text-[11px] font-bold text-good">
          <ShieldCheck className="size-3.5" />
          Verified
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col-reverse px-3 py-3 text-center"
          >
            <dt className="mt-0.5 text-[11px] text-muted-foreground">
              {label}
            </dt>
            <dd className="font-head text-2xl font-extrabold tracking-tight">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {unreviewed > 0 ? (
          <>
            <span className="font-semibold text-foreground">
              {unreviewed} new {unreviewed === 1 ? "referral" : "referrals"}
            </span>{" "}
            waiting for an interview
          </>
        ) : (
          "You're all caught up on referrals"
        )}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="px-3 font-head sm:px-4"
          nativeButton={false}
          render={<Link href={COMPANY_JOBS} />}
        >
          <Building2 className="size-4" />
          Postings
        </Button>
        <Button
          className="bg-brand px-3 font-head text-brand-foreground hover:bg-brand-dark sm:px-4"
          nativeButton={false}
          render={<Link href={COMPANY_HOME} />}
        >
          <LayoutDashboard className="size-4" />
          Dashboard
        </Button>
      </div>
    </aside>
  );
}

function ApplicantCard({
  applicant: a,
  designation,
}: {
  applicant: Applicant;
  designation?: string;
}) {
  const rejected = a.status === "rejected";
  return (
    <li className="group relative flex flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`${COMPANY_APPLICANTS}/${a.ref}`}
            className="block truncate font-head font-bold tracking-tight after:absolute after:inset-0 after:rounded-2xl group-hover:text-brand"
          >
            {a.name ?? a.label}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {designation ?? "Job posting"}
          </p>
        </div>
        <span
          className={cn(
            "flex-none rounded-full px-2.5 py-0.5 font-head text-[11px] font-bold",
            stageBadge(a),
          )}
        >
          {rejected
            ? "Not selected"
            : a.selected
              ? "Selected"
              : STAGES[a.stage]}
        </span>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <Briefcase className="size-3.5 text-brand" />
          {formatExperienceMonths(a.experienceMonths)}
        </li>
        <li className="flex items-center gap-1.5">
          <MapPin className="size-3.5 text-brand" />
          {a.city}
        </li>
      </ul>

      {a.skills.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {a.skills.slice(0, 3).map((skill) => (
            <li
              key={skill}
              className="max-w-full truncate rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
            >
              {skill}
            </li>
          ))}
          {a.skills.length > 3 && (
            <li className="rounded-full px-1 py-1 text-[11px] text-muted-foreground">
              +{a.skills.length - 3}
            </li>
          )}
        </ul>
      )}

      <div className="mt-auto pt-4">
        <div className="flex -mx-4 px-4 items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">
            Referred {formatShortDate(a.referredOn)}
          </span>
          <span className="inline-flex items-center gap-1 font-head text-xs font-bold text-brand">
            Review
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </li>
  );
}

function PostingCard({
  job,
  applicants,
}: {
  job: CompanyJob;
  applicants: Applicant[];
}) {
  const active = applicants.filter((a) => a.status === "active");
  const counts = [
    { label: "Referred", value: applicants.length },
    {
      label: "New referrals",
      value: active.filter((a) => a.stage === REFERRED_STAGE).length,
    },
    {
      label: "Interviewing",
      value: active.filter((a) => a.stage > REFERRED_STAGE).length,
    },
  ];

  return (
    <li className="group relative flex flex-col rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={jobApplicantsHref(job.id)}
            className="block truncate font-head font-bold tracking-tight after:absolute after:inset-0 after:rounded-2xl group-hover:text-brand"
          >
            {job.designation}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {job.role} · {job.city}
          </p>
        </div>
        <JobStatusPill status={job.status} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        {counts.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col-reverse rounded-xl bg-muted/60 px-2 py-2 text-center"
          >
            <dt className="text-[11px] text-muted-foreground">{label}</dt>
            <dd className="font-head text-lg font-extrabold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="-mx-5 mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 pt-4 text-xs text-muted-foreground">
        <span className="font-head text-sm font-bold text-foreground">
          <Salary value={formatSalary(job)} />
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {formatExperience(job)} · {postedAgo(job.createdAt)}
        </span>
      </div>
    </li>
  );
}

function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <h2 className="mt-2 font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="inline-flex flex-none items-center gap-1 font-head text-sm font-bold text-brand hover:text-brand-dark"
      >
        {linkLabel} <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
