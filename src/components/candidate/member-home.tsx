import Form from "next/form";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  BriefcaseBusiness,
  Eye,
  LayoutDashboard,
  MapPin,
  Search,
  Send,
  Star,
} from "lucide-react";

import { CandidateAvatar } from "@/components/candidate/candidate-avatar";
import { EmptyState } from "@/components/candidate/dashboard-ui";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { CompanyAvatar } from "@/components/company-avatar";
import { JobCard } from "@/components/job-card";
import { RecruiterBoard } from "@/components/recruiter-board";
import { SectionEyebrow } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { STAGES, type Application } from "@/lib/candidate-activity";
import { greeting } from "@/lib/greeting";
import type { JobListing } from "@/lib/jobs-data";
import type { MembershipView } from "@/server/auth/current-candidate";
import { NOT_SELECTED_BADGE } from "@/lib/status-badge";
import { INDUSTRIES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { listCandidateApplications } from "@/server/applications/candidate";
import { requireMember } from "@/server/auth/current-candidate";
import { getCandidatePhotoUrl } from "@/server/candidates/photo";
import { getHireBrands } from "@/server/hire-brands/directory";

const RECOMMENDED = 6;

type Member = Extract<MembershipView, { kind: "member" }>;

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
      <section className="bg-linear-to-b from-muted/60 to-background px-4 pt-8 pb-12 sm:px-6 md:py-12 lg:py-16">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="min-w-0">
            <p className="font-head text-sm font-semibold text-muted-foreground">
              {greeting(new Date())},
            </p>
            <h1 className="mt-1 font-head text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">
              {candidate.first_name},{" "}
              <span className="text-brand">your next role</span> is here.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
              {jobs.length} live {jobs.length === 1 ? "opening" : "openings"}{" "}
              from verified employers. Apply in one click and track every step.
            </p>

            <Form
              action="/jobs"
              className="mt-7 flex max-w-xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-md sm:flex-row"
            >
              <label className="relative flex h-11 flex-1 items-center gap-2 border-b border-border px-3 sm:border-r sm:border-b-0">
                <Search className="size-4 flex-none text-muted-foreground" />
                <input
                  name="q"
                  aria-label="Job title or company"
                  placeholder="Job title or company"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </label>
              <label className="relative flex h-11 items-center gap-2 px-3 sm:w-40">
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
                Search
              </Button>
            </Form>

            {roles.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-medium text-muted-foreground">
                  Jump to your preferred roles
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <li key={role}>
                      <Link
                        href={`/jobs?q=${encodeURIComponent(role)}`}
                        className="inline-flex rounded-full border border-border bg-card px-3 py-1.5 font-head text-xs font-semibold transition-colors hover:border-brand hover:text-brand"
                      >
                        {role}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <ActivityCard
            firstName={candidate.first_name}
            lastName={candidate.last_name}
            photoUrl={photoUrl}
            sector={sector}
            city={candidate.city}
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
                ? `${sector ?? "Roles"} jobs matched to your profile`
                : "Latest jobs on JobClubb"
            }
            href={
              sector ? `/jobs?sector=${encodeURIComponent(sector)}` : "/jobs"
            }
            linkLabel="See all jobs"
          />
          {picks.jobs.length === 0 ? (
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
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {picks.jobs.map((job) => (
                <li key={job.slug} className="min-w-0">
                  <JobCard job={job} locked={false} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <SectorBrowser jobs={jobs} />

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
    const score =
      (job.industry === profile.sector ? 4 : 0) +
      (roles.some((r) => title.includes(r)) ? 3 : 0) +
      (city && job.location.toLowerCase() === city ? 2 : 0);
    return { job, score };
  });
  const ranked = scored.toSorted((a, b) => b.score - a.score);
  return {
    matched: ranked.some((r) => r.score > 0),
    jobs: ranked.slice(0, RECOMMENDED).map((r) => r.job),
  };
}

function ActivityCard({
  firstName,
  lastName,
  photoUrl,
  sector,
  city,
  view,
  applications,
}: {
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  sector?: string;
  city: string;
  view: Member;
  applications: Application[];
}) {
  const active = applications.filter((a) => a.status === "active");
  const stats = [
    { label: "Applied", value: applications.length, icon: Send },
    {
      label: "Viewed",
      value: active.filter((a) => a.stage >= 1).length,
      icon: Eye,
    },
    {
      label: "Shortlisted",
      value: active.filter((a) => a.stage >= 2).length,
      icon: Star,
    },
  ];
  const recent = applications.slice(0, 3);

  return (
    <aside className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6">
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
          <p className="flex items-center gap-3 truncate text-xs text-muted-foreground">
            {sector && (
              <span className="flex items-center gap-1">
                <Briefcase className="size-3" /> {sector}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="size-3" /> {city}
            </span>
          </p>
        </div>
        <span className="flex flex-none items-center gap-1 rounded-full bg-good/12 px-2.5 py-1 font-head text-[11px] font-bold text-good">
          <BadgeCheck className="size-3.5" />
          {view.plan === "franchise" ? "Franchise" : "Member"}
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-2">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-muted/60 p-3">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="size-3.5 text-brand" />
              {label}
            </dt>
            <dd className="mt-1 font-head text-2xl font-extrabold tracking-tight">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <p className="font-head text-sm font-bold tracking-tight">
          Recent applications
        </p>
        {recent.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
            Your applications and their live stage will show up here.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {recent.map((a) => (
              <li
                key={a.id}
                className="relative flex items-center gap-3 py-2.5"
              >
                <CompanyAvatar
                  name={a.job.company}
                  logoUrl={a.job.companyLogoUrl}
                  className="size-9"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`${CANDIDATE_HOME}/applications/${a.id}`}
                    className="block truncate font-head text-sm font-bold after:absolute after:inset-0 hover:text-brand"
                  >
                    {a.job.designation}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.job.company} · {a.updatedAgo}
                  </p>
                </div>
                <StatusBadge application={a} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Membership active until{" "}
        <span className="font-semibold text-foreground">{view.validUntil}</span>
        {view.daysLeft <= 30 && ` · ${view.daysLeft} days left`}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="font-head"
          nativeButton={false}
          render={<Link href={`${CANDIDATE_HOME}/applications`} />}
        >
          <Send className="size-4" />
          Applications
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

function StatusBadge({ application: a }: { application: Application }) {
  const closed = a.status !== "active";
  return (
    <span
      className={cn(
        "flex-none rounded-full px-2.5 py-0.5 font-head text-xs font-bold whitespace-nowrap",
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
  );
}

function SectorBrowser({ jobs }: { jobs: JobListing[] }) {
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
                className="group flex h-full flex-col justify-between gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-brand/40"
              >
                <span className="font-head text-sm leading-5 font-semibold">
                  {name}
                </span>
                <span className="flex items-center justify-between text-xs text-muted-foreground">
                  {count} open {count === 1 ? "role" : "roles"}
                  <ArrowRight className="size-3.5 text-brand transition-transform group-hover:translate-x-0.5" />
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
