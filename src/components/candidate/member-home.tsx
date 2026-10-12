import Form from "next/form";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  BriefcaseBusiness,
  Clock,
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
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { CompanyAvatar } from "@/components/company-avatar";
import { RecruiterBoard } from "@/components/recruiter-board";
import { SectionEyebrow } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { STAGES, type Application } from "@/lib/candidate-activity";
import { greeting } from "@/lib/greeting";
import type { JobListing } from "@/lib/jobs-data";
import { NOT_SELECTED_BADGE } from "@/lib/status-badge";
import { INDUSTRIES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { listCandidateApplications } from "@/server/applications/candidate";
import {
  requireMember,
  type MembershipView,
} from "@/server/auth/current-candidate";
import { getCandidatePhotoUrl } from "@/server/candidates/photo";
import { getHireBrands } from "@/server/hire-brands/directory";

const RECOMMENDED = 6;

type Member = Extract<MembershipView, { kind: "member" }>;
type Pick = { job: JobListing; reasons: string[] };

export async function MemberHome({
  view,
  jobs,
}: {
  view: Member;
  jobs: JobListing[];
}) {
  const candidate = await requireMember("/");
  const [photoUrl, applications, brands] = await Promise.all([
    getCandidatePhotoUrl(candidate.photo_path),
    listCandidateApplications(candidate.id),
    getHireBrands(),
  ]);

  const sector = INDUSTRIES.find((v) => v.slug === candidate.industry)?.name;
  const roles: string[] = candidate.preferred_roles ?? [];
  const applied = new Set(applications.map((a) => a.job.slug));
  const picks = recommend(
    jobs.filter((job) => !applied.has(job.slug)),
    { sector, city: candidate.city, roles },
  );

  return (
    <>
      <section className="jc-auth-panel relative isolate px-4 pt-8 pb-12 text-white sm:px-6 md:py-14">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/85 ring-1 ring-white/15">
              <span className="size-1.5 animate-pulse rounded-full bg-brand-accent" />
              {jobs.length} live {jobs.length === 1 ? "opening" : "openings"}{" "}
              from verified employers
            </span>
            <h1 className="mt-5 font-head text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
              {greeting(new Date())},{" "}
              <span className="text-brand-accent">{candidate.first_name}</span>
            </h1>
            <p className="mt-3 max-w-lg text-base leading-7 text-white/75">
              Find your next role, apply in one click and follow every step
              until you&apos;re hired.
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
            view={view}
            applications={applications}
          />
        </div>
      </section>

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
            <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <TopMatch pick={picks.items[0]} matched={picks.matched} />
              {picks.items.length > 1 && (
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                  {picks.items.slice(1).map((pick) => (
                    <PickRow key={pick.job.slug} pick={pick} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      {applications.length > 0 && (
        <section className="px-4 pb-12 sm:px-6 md:pb-16">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Your applications"
              title="Pick up where you left off"
              href={`${CANDIDATE_HOME}/applications`}
              linkLabel="All applications"
            />
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
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

function recommend(
  jobs: JobListing[],
  profile: { sector?: string; city: string; roles: string[] },
) {
  const roles = profile.roles.map((r) => r.toLowerCase());
  const city = profile.city.toLowerCase();
  const scored = jobs.map((job) => {
    const title = `${job.title} ${job.designation}`.toLowerCase();
    const reasons: string[] = [];
    let score = 0;
    if (job.industry === profile.sector) {
      score += 4;
      reasons.push("Your sector");
    }
    if (roles.some((r) => title.includes(r))) {
      score += 3;
      reasons.push("Preferred role");
    }
    if (city && job.location.toLowerCase() === city) {
      score += 2;
      reasons.push("In your city");
    }
    return { job, reasons, score };
  });
  const ranked = scored.toSorted((a, b) => b.score - a.score);
  return {
    matched: ranked.some((r) => r.score > 0),
    items: ranked.slice(0, RECOMMENDED) satisfies Pick[],
  };
}

function ProfileCard({
  firstName,
  lastName,
  photoUrl,
  city,
  sector,
  view,
  applications,
}: {
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  city: string;
  sector?: string;
  view: Member;
  applications: Application[];
}) {
  const active = applications.filter((a) => a.status === "active");
  const stats = [
    { label: "Applied", value: applications.length },
    {
      label: "Viewed",
      value: active.filter((a) => a.stage >= 1).length,
    },
    {
      label: "Shortlisted",
      value: active.filter((a) => a.stage >= 2).length,
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
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3 flex-none" />
            {sector ? `${sector} · ${city}` : city}
          </p>
        </div>
        <span className="flex flex-none items-center gap-1 rounded-full bg-good/12 px-2.5 py-1 font-head text-[11px] font-bold text-good">
          <BadgeCheck className="size-3.5" />
          {view.plan === "franchise" ? "Franchise" : "Member"}
        </span>
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

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Membership active till{" "}
        <span className="font-semibold text-foreground">{view.validUntil}</span>
        {view.daysLeft <= 30 && ` · ${view.daysLeft} days left`}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="font-head"
          nativeButton={false}
          render={<Link href={`${CANDIDATE_HOME}/resume`} />}
        >
          <FileText className="size-4" />
          Resume
        </Button>
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

function TopMatch({ pick, matched }: { pick: Pick; matched: boolean }) {
  const { job } = pick;
  const meta = [
    { icon: MapPin, value: job.location },
    { icon: Briefcase, value: job.experience },
    { icon: Clock, value: `${job.workMode} · ${job.jobType}` },
  ];

  return (
    <article className="group relative flex flex-col rounded-2xl border-2 border-brand bg-linear-to-br from-brand/6 to-card p-5 shadow-md shadow-brand/10 transition-shadow hover:shadow-lg hover:shadow-brand/20">
      <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 font-head text-[11px] font-bold text-brand-foreground shadow-sm">
        <Sparkles className="size-3.5" />
        {matched ? "Best match" : "Newest"}
      </span>

      <div className="flex items-start gap-4">
        <CompanyAvatar
          name={job.company}
          logoUrl={job.companyLogoUrl}
          className="size-14 rounded-2xl"
        />
        <div className="min-w-0">
          <h3 className="font-head text-xl leading-snug font-extrabold tracking-tight">
            <Link
              href={`/jobs/${job.slug}`}
              className="after:absolute after:inset-0 after:rounded-2xl group-hover:text-brand"
            >
              {job.title}
            </Link>
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {job.company} · {job.postedAgo}
          </p>
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {meta.map(({ icon: Icon, value }) => (
          <li key={value} className="flex items-center gap-1.5">
            <Icon className="size-4 flex-none text-brand" />
            {value}
          </li>
        ))}
      </ul>

      {pick.reasons.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {pick.reasons.map((reason) => (
            <li
              key={reason}
              className="rounded-full bg-good/12 px-2.5 py-1 font-head text-[11px] font-bold text-good"
            >
              ✓ {reason}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 -mx-5 px-5 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted-foreground">Salary</p>
          <p className="font-head text-lg font-extrabold">{job.salaryRange}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 font-head text-sm font-bold text-brand-foreground transition-colors group-hover:bg-brand-dark">
          View & apply
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}

function PickRow({ pick }: { pick: Pick }) {
  const { job } = pick;
  return (
    <li className="group relative flex items-center gap-3 p-4 transition-colors hover:bg-muted/50 sm:gap-4">
      <CompanyAvatar
        name={job.company}
        logoUrl={job.companyLogoUrl}
        className="size-11 rounded-xl"
      />
      <div className="min-w-0 flex-1">
        <Link
          href={`/jobs/${job.slug}`}
          className="block truncate font-head font-bold tracking-tight after:absolute after:inset-0 group-hover:text-brand"
        >
          {job.title}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {job.company} · {job.location} · {job.postedAgo}
        </p>
      </div>
      <div className="hidden flex-none text-right sm:block">
        <p className="font-head text-sm font-bold">{job.salaryRange}</p>
        {pick.reasons[0] && (
          <p className="text-[11px] font-semibold text-good">
            {pick.reasons[0]}
          </p>
        )}
      </div>
      <ArrowRight className="size-4 flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
    </li>
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
            a.status === "rejected"
              ? NOT_SELECTED_BADGE
              : closed
                ? "bg-muted text-muted-foreground"
                : a.stage >= 3
                  ? "bg-good/12 text-good"
                  : "bg-brand/10 text-brand",
          )}
        >
          {a.status === "rejected"
            ? "Not selected"
            : closed
              ? "Closed"
              : STAGES[a.stage]}
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
                  <span className="block truncate font-head text-sm font-bold">
                    {name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {count} open {count === 1 ? "role" : "roles"}
                    {name === sector && " · Your sector"}
                  </span>
                </span>
                <span className="flex size-8 flex-none items-center justify-center rounded-full bg-muted text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
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
