import Form from "next/form";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CircleAlert,
  Eye,
  FileText,
  LayoutDashboard,
  MapPin,
  Search,
  Send,
  Sparkles,
  Star,
} from "lucide-react";

import { CandidateAvatar } from "@/components/candidate/candidate-avatar";
import { EmptyState } from "@/components/candidate/dashboard-ui";
import { JobPicksGrid, NoNearbyNote } from "@/components/candidate/job-picks";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { CompanyAvatar } from "@/components/company-avatar";
import { RecruiterBoard } from "@/components/recruiter-board";
import { SectionEyebrow } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import {
  REFERRED_STAGE,
  STAGES,
  applicationStatus,
  type Application,
} from "@/lib/candidate-activity";
import { greeting } from "@/lib/greeting";
import type { JobListing } from "@/lib/jobs-data";
import { CHECKOUT_PATH, PLAN_DETAILS, type MembershipPlan } from "@/lib/membership";
import { stageBadge } from "@/lib/status-badge";
import { INDUSTRIES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { listCandidateApplications } from "@/server/applications/candidate";
import { requireMember } from "@/server/auth/current-candidate";
import { getCandidatePhotoUrl } from "@/server/candidates/photo";
import { getHireBrands } from "@/server/hire-brands/directory";
import { recommendJobs } from "@/server/jobs/recommend";

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);

export async function MemberHome({ jobs }: { jobs: JobListing[] }) {
  const candidate = await requireMember("/", { allowLapsed: true });
  const expiresAt = new Date(candidate.membership_expires_at);
  const accessUntil = candidate.lapsedAccessUntil;
  const now = new Date();
  const [photoUrl, applications, brands] = await Promise.all([
    getCandidatePhotoUrl(candidate.photo_path),
    listCandidateApplications(candidate.id),
    getHireBrands(),
  ]);

  const sector = INDUSTRIES.find((v) => v.slug === candidate.industry)?.name;
  const roles: string[] = candidate.preferred_roles ?? [];
  const applied = new Set(applications.map((a) => a.job.slug));
  const picks = recommendJobs(
    jobs.filter((job) => !applied.has(job.slug)),
    { sector, city: candidate.city, pincode: candidate.pincode, roles },
  );

  return (
    <>
      <section className="jc-auth-panel relative isolate px-4 pt-8 pb-12 text-white sm:px-6 md:py-14">
        <div className="mx-auto grid grid-cols-1 max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0">
            {/* <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/85 ring-1 ring-white/15">
              <span className="size-1.5 animate-pulse rounded-full bg-brand-accent" />
              {jobs.length} live {jobs.length === 1 ? "opening" : "openings"}{" "}
              from verified employers
            </span> */}
            <h1 className="font-head text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
              {greeting(new Date())},{" "}
              <span className="text-brand-accent">{candidate.first_name}</span>
            </h1>
            <p className="mt-3 max-w-lg text-base leading-7 text-white/75">
              {accessUntil
                ? `Your membership has expired. You can still follow your applications and interviews until ${formatDate(accessUntil)}.`
                : "Find your next role, apply in one click and follow every step until you're hired."}
            </p>

            <Form
              action="/jobs"
              className="mt-7 flex max-w-2xl flex-col gap-1 rounded-2xl bg-card p-1.5 text-foreground shadow-xl sm:flex-row sm:items-center"
            >
              <label className="flex h-11 min-w-0 items-center gap-2 px-3 sm:flex-1">
                <Search className="size-4 flex-none text-muted-foreground" />
                <input
                  name="q"
                  aria-label="Job title or company"
                  placeholder="Job title or company"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </label>
              <span className="-mx-1.5 h-px bg-border sm:mx-0 sm:h-6 sm:w-px" />
              <label className="flex h-11 items-center gap-2 px-3 sm:w-44">
                <MapPin className="size-4 flex-none text-muted-foreground" />
                <input
                  name="loc"
                  aria-label="City or pincode"
                  placeholder={candidate.city || "City"}
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </label>
              <Button
                type="submit"
                className="h-11 bg-brand px-6 font-head text-brand-foreground hover:bg-brand-dark"
              >
                Search jobs
              </Button>
            </Form>

            {roles.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-white/70">Your roles:</span>
                {roles.map((role) => (
                  <Link
                    key={role}
                    href={`/jobs?q=${encodeURIComponent(role)}`}
                    className="rounded-full bg-white/10 px-3 py-1 font-head text-xs font-semibold ring-1 ring-white/20 transition-colors hover:bg-white hover:text-brand"
                  >
                    {role}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <ProfileCard
            firstName={candidate.first_name}
            lastName={candidate.last_name}
            photoUrl={photoUrl}
            city={candidate.city}
            sector={sector}
            plan={candidate.membership_plan}
            expiresAt={expiresAt}
            accessUntil={accessUntil}
            now={now}
            applications={applications}
          />
        </div>
      </section>

      {accessUntil ? (
        <RenewBanner expiresAt={expiresAt} />
      ) : (
        <section className="px-4 py-12 sm:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow={picks.matched ? "Picked for you" : "Fresh openings"}
              title={
                picks.matched
                  ? "Roles that match your profile"
                  : "Latest jobs on JobClubb"
              }
              href={
                sector ? `/jobs?sector=${encodeURIComponent(sector)}` : "/jobs"
              }
              linkLabel="See all jobs"
            />
            {picks.items.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  icon={BriefcaseBusiness}
                  title="No new openings right now"
                >
                  {applied.size
                    ? "You've applied to every live role. Verified employers post new ones every week."
                    : "Verified employers post new roles every week. Check back soon."}
                </EmptyState>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {!picks.nearby && <NoNearbyNote city={candidate.city} />}
                <JobPicksGrid picks={picks} />
              </div>
            )}
          </div>
        </section>
      )}

      {applications.length > 0 && (
        <section className="px-4 pb-12 sm:px-6 md:pb-16">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Your applications"
              title="Pick up where you left off"
              href={`${CANDIDATE_HOME}/applications`}
              linkLabel="All applications"
            />
            <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {applications.slice(0, 3).map((a) => (
                <ApplicationCard key={a.id} application={a} />
              ))}
            </ul>
          </div>
        </section>
      )}

      <SectorGrid jobs={jobs} sector={sector} />

      {brands.length > 0 && (
        <section className="px-4 py-12 sm:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Verified employers"
              title="Companies hiring on JobClubb"
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

function ProfileCard({
  firstName,
  lastName,
  photoUrl,
  city,
  sector,
  plan,
  expiresAt,
  accessUntil,
  now,
  applications,
}: {
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  city: string;
  sector?: string;
  plan: MembershipPlan;
  expiresAt: Date;
  accessUntil: Date | null;
  now: Date;
  applications: Application[];
}) {
  const daysLeft = Math.ceil(
    (expiresAt.getTime() - now.getTime()) / 86_400_000,
  );
  const active = applications.filter((a) => a.status === "active");
  const stats = [
    { label: "Applied", value: applications.length },
    {
      label: "Screening",
      value: active.filter((a) => a.stage >= 1).length,
    },
    {
      label: "Referred",
      value: active.filter((a) => a.stage >= REFERRED_STAGE).length,
    },
  ];

  return (
    <aside className="min-w-0 rounded-3xl bg-card p-5 text-foreground shadow-xl sm:p-6">
      <div className="flex items-center gap-3">
        <CandidateAvatar
          firstName={firstName}
          lastName={lastName}
          photoUrl={photoUrl}
          className="size-12 rounded-2xl bg-linear-to-br from-brand to-brand-accent text-sm text-white"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-head font-bold tracking-tight">
            {firstName} {lastName}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 flex-none" />
            <span className="truncate">
              {sector ? `${sector} · ${city}` : city}
            </span>
          </p>
        </div>
        {accessUntil ? (
          <span className="flex flex-none items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 font-head text-[11px] font-bold text-amber-600">
            <CircleAlert className="size-3.5" />
            Expired
          </span>
        ) : (
          <span className="flex flex-none items-center gap-1 rounded-full bg-good/12 px-2.5 py-1 font-head text-[11px] font-bold text-good">
            <BadgeCheck className="size-3.5" />
            {PLAN_DETAILS[plan].badge}
          </span>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col-reverse px-3 py-3 text-center"
          >
            <dt className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              {label}
            </dt>
            <dd className="font-head text-2xl font-extrabold tracking-tight">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {accessUntil ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Membership expired on{" "}
          <span className="font-semibold text-foreground">
            {formatDate(expiresAt)}
          </span>
          . View-only access until{" "}
          <span className="font-semibold text-foreground">
            {formatDate(accessUntil)}
          </span>
          .
        </p>
      ) : (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Membership active till{" "}
          <span className="font-semibold text-foreground">
            {formatDate(expiresAt)}
          </span>
          {daysLeft <= 30 && ` · ${daysLeft} days left`}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {accessUntil ? (
          <Button
            variant="outline"
            className="font-head"
            nativeButton={false}
            render={<Link href={CHECKOUT_PATH} />}
          >
            <Sparkles className="size-4" />
            Renew
          </Button>
        ) : (
          <Button
            variant="outline"
            className="font-head"
            nativeButton={false}
            render={<Link href={`${CANDIDATE_HOME}/resume`} />}
          >
            <FileText className="size-4" />
            Resume
          </Button>
        )}
        <Button
          className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
          nativeButton={false}
          render={<Link href={CANDIDATE_HOME} />}
        >
          <LayoutDashboard className="size-4" />
          Dashboard
        </Button>
      </div>
    </aside>
  );
}

function RenewBanner({ expiresAt }: { expiresAt: Date }) {
  return (
    <section className="px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:p-8">
        <span className="flex size-12 flex-none items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Sparkles className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-head text-xl font-extrabold tracking-tight">
            Renew to see roles picked for you
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Your membership expired on {formatDate(expiresAt)}. Renew to unlock
            full job details, salaries and one-click apply again.
          </p>
        </div>
        <Button
          className="bg-brand font-head text-brand-foreground hover:bg-brand-dark sm:flex-none"
          nativeButton={false}
          render={<Link href={CHECKOUT_PATH} />}
        >
          Renew membership
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  );
}

function ApplicationCard({ application: a }: { application: Application }) {
  const closed = a.status !== "active";
  return (
    <li className="group relative rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand/40">
      <div className="flex items-center gap-3">
        <CompanyAvatar
          name={a.job.company}
          logoUrl={a.job.companyLogoUrl}
          className="size-10"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`${CANDIDATE_HOME}/applications/${a.id}`}
            className="block truncate font-head text-sm font-bold after:absolute after:inset-0 after:rounded-2xl group-hover:text-brand"
          >
            {a.job.designation}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {a.job.company} · {a.job.location}
          </p>
        </div>
      </div>
      <div aria-hidden className="mt-4 grid grid-cols-5 gap-1">
        {STAGES.map((stage, i) => (
          <span
            key={stage}
            className={cn(
              "h-1.5 rounded-full",
              a.status === "rejected"
                ? i <= a.stage
                  ? "bg-brand"
                  : i === a.stage + 1
                    ? "bg-destructive"
                    : "bg-muted"
                : !closed && i <= a.stage
                  ? "bg-brand"
                  : "bg-muted",
            )}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 font-head text-xs font-bold",
            stageBadge(a, closed),
          )}
        >
          {a.status === "closed" ? "Closed" : applicationStatus(a)}
        </span>
        <span className="text-xs text-muted-foreground">
          Updated {a.updatedAgo.toLowerCase()}
        </span>
      </div>
    </li>
  );
}

function SectorGrid({ jobs, sector }: { jobs: JobListing[]; sector?: string }) {
  const sectors = INDUSTRIES.map((industry) => ({
    name: industry.name,
    count: jobs.filter((job) => job.industry === industry.name).length,
  }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
  if (sectors.length === 0) return null;

  return (
    <section className="border-y border-border bg-card px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Browse by sector"
          title="Explore every open role"
          href="/jobs"
          linkLabel="All jobs"
        />
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {sectors.map(({ name, count }) => (
            <li key={name}>
              <Link
                href={`/jobs?sector=${encodeURIComponent(name)}`}
                className={cn(
                  "group flex h-full items-center justify-between gap-3 rounded-2xl border bg-background p-4 transition-colors hover:border-brand/40",
                  name === sector ? "border-brand/40" : "border-border",
                )}
              >
                <span className="min-w-0">
                  <span className="block font-head text-sm font-bold sm:truncate">
                    {name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {count} open {count === 1 ? "role" : "roles"}
                    {name === sector && " · Your sector"}
                  </span>
                </span>
                <span className="hidden size-8 flex-none items-center justify-center rounded-full bg-muted text-brand sm:flex transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
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
