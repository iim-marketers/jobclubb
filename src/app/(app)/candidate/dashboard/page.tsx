import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CalendarClock,
  Check,
  Eye,
  FileText,
  Heart,
  IndianRupee,
  MapPin,
  Send,
  Video,
} from "lucide-react";

import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { CompanyAvatar } from "@/components/company-avatar";
import { Button } from "@/components/ui/button";
import { JOBS } from "@/lib/jobs-data";
import { VERTICALS } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import type { MembershipPlan } from "@/lib/membership";
import { requireCandidateWithPlan } from "@/server/auth/current-candidate";

export const metadata = { title: "Dashboard — JobClubb" };

// TODO: replace the mock data below with the candidate's real applications,
// interviews and profile completeness once those tables exist.
const STAGES = [
  "Applied",
  "Viewed",
  "Shortlisted",
  "Interview",
  "Offer",
] as const;
const PIPELINE = [12, 8, 4, 2, 0];

const APPLICATIONS = [
  { job: JOBS[1], stage: 3, applied: "2 days ago" },
  { job: JOBS[0], stage: 1, applied: "4 days ago" },
  { job: JOBS[2], stage: 2, applied: "1 week ago" },
  { job: JOBS[3], stage: 0, applied: "3 weeks ago", closed: true },
];

const INTERVIEWS = [
  { company: "IndiGo", state: "done" as const, note: "Completed 12 Sep" },
  { company: "Taj", state: "scheduled" as const, note: "Thu, 25 Sep" },
  { company: null, state: "open" as const, note: "Still yours to use" },
];

const CHECKLIST = [
  { label: "Verify email address", done: true },
  { label: "Add home location", done: true },
  { label: "Generate ATS resume", done: true },
  { label: "Add work experience", done: false },
  { label: "Upload a profile photo", done: false },
];

const STATS = [
  { label: "Applications sent", value: "12", note: "+3 this week", icon: Send },
  { label: "Profile views", value: "38", note: "+12% vs last week", icon: Eye },
  {
    label: "In review",
    value: "4",
    note: "Avg. reply in 3 days",
    icon: Briefcase,
  },
  { label: "Saved jobs", value: "7", note: "2 closing soon", icon: Heart },
];

const IST = "Asia/Kolkata";

function greeting(now: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: IST,
    }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function CandidateDashboard() {
  const candidate = await requireCandidateWithPlan(CANDIDATE_HOME);
  const vertical = VERTICALS.find((v) => v.slug === candidate.vertical);
  const sector = vertical?.name;
  const now = new Date();

  const recommended = [
    ...JOBS.filter((j) => j.vertical === sector),
    ...JOBS.filter((j) => j.vertical !== sector && j.featured),
  ].slice(0, 3);

  const completed = CHECKLIST.filter((c) => c.done).length;
  const strength = Math.round((completed / CHECKLIST.length) * 100);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
            {greeting(now)}, {candidate.first_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You have{" "}
            <span className="font-semibold text-foreground">1 interview</span>{" "}
            this week and{" "}
            <span className="font-semibold text-foreground">
              4 applications
            </span>{" "}
            in review.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="font-head"
            nativeButton={false}
            render={<Link href={`${CANDIDATE_HOME}/resume`} />}
          >
            <FileText className="size-4" />
            Update resume
          </Button>
          <Button
            className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href="/jobs" />}
          >
            Find jobs
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <ProfileSummary
          plan={candidate.membership_plan}
          firstName={candidate.first_name}
          lastName={candidate.last_name}
          city={candidate.city}
          sector={sector}
          roles={vertical?.roles.slice(0, 4) ?? []}
          strength={strength}
        />
        <InterviewGuarantee />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {STATS.map(({ label, value, note, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-4 sm:p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground sm:text-sm">
                {label}
              </p>
              <span className="flex size-8 flex-none items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-2 font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
              {value}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {note}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card
          title="Application journey"
          description="Where each of your applications stands"
          action={
            <Link
              href={`${CANDIDATE_HOME}/applications`}
              className="inline-flex flex-none items-center gap-1 font-head text-sm font-bold whitespace-nowrap text-brand hover:text-brand-dark"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          }
        >
          <Pipeline />

          <ul className="mt-6 divide-y divide-border border-t border-border">
            {APPLICATIONS.map(({ job, stage, applied, closed }) => (
              <li
                key={job.slug}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 last:pb-0"
              >
                <CompanyAvatar name={job.company} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/jobs/${job.slug}`}
                    className="block truncate font-head text-sm font-bold hover:text-brand"
                  >
                    {job.designation}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {job.company} · {job.location} · {applied}
                  </p>
                </div>
                <div className="flex w-full items-center gap-3 pl-14 sm:w-auto sm:pl-0">
                  <StageMeter stage={stage} closed={closed} />
                  <span
                    className={cn(
                      "w-20 text-right font-head text-xs font-bold",
                      closed
                        ? "text-muted-foreground"
                        : stage >= 3
                          ? "text-good"
                          : "text-brand",
                    )}
                  >
                    {closed ? "Closed" : STAGES[stage]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="min-w-0 space-y-6">
          <Card
            title="Profile strength"
            description="Stronger profiles get shortlisted faster"
          >
            <div className="flex items-center gap-5">
              <Ring value={strength} />
              <ul className="min-w-0 flex-1 space-y-2">
                {CHECKLIST.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className={cn(
                        "flex size-4.5 flex-none items-center justify-center rounded-full",
                        item.done
                          ? "bg-good/15 text-good"
                          : "border border-dashed border-muted-foreground/50",
                      )}
                    >
                      {item.done && (
                        <Check className="size-3" strokeWidth={3} />
                      )}
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
              </ul>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-5 w-full font-head"
              nativeButton={false}
              render={<Link href={`${CANDIDATE_HOME}/resume`} />}
            >
              Complete profile
            </Button>
          </Card>

          <Card title="Your location" description="Matching jobs within 25 km">
            <div className="flex items-start gap-3">
              <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-brand-accent/15 text-good">
                <MapPin className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-head text-sm font-bold">
                  {candidate.city}, {candidate.pincode}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  {sector ? `${sector} roles` : "Roles"} near your saved address
                  show up first.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full font-head text-brand"
              nativeButton={false}
              render={<Link href={`${CANDIDATE_HOME}/settings`} />}
            >
              Change location
            </Button>
          </Card>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-head text-lg font-bold tracking-tight">
              Picked for you
            </h2>
            {/* <p className="text-sm text-muted-foreground">
              {sector ? `Fresh ${sector} openings` : "Fresh openings"} matched
              to your profile
            </p> */}
          </div>
          <Link
            href="/jobs"
            className="inline-flex flex-none items-center gap-1 font-head text-sm font-bold text-brand hover:text-brand-dark"
          >
            All jobs <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {recommended.map((job) => (
            <Link
              key={job.slug}
              href={`/jobs/${job.slug}`}
              className="group flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5"
            >
              <div className="flex items-start gap-3">
                <CompanyAvatar name={job.company} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-head font-bold tracking-tight group-hover:text-brand">
                    {job.designation}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {job.company}
                  </p>
                </div>
                <ArrowUpRight className="size-4 flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
                <Chip icon={MapPin}>{job.location}</Chip>
                <Chip icon={IndianRupee}>
                  {job.salaryRange.replace(/₹/g, "")}
                </Chip>
              </div>
              <p className="mt-auto pt-4 text-xs text-muted-foreground">
                {job.jobType} · {job.workMode} · {job.postedAgo}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProfileSummary({
  firstName,
  lastName,
  city,
  sector,
  roles,
  strength,
  plan,
}: {
  firstName: string;
  lastName: string;
  city: string;
  sector?: string;
  roles: string[];
  strength: number;
  plan: MembershipPlan;
}) {
  const nextStep = CHECKLIST.find((c) => !c.done);

  return (
    <section
      aria-label="Your profile"
      className="flex min-w-0 flex-col gap-6 rounded-3xl bg-linear-to-br from-brand-surface to-brand-surface-strong p-6 text-white sm:p-7 md:flex-row md:items-stretch"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-4">
          <span className="flex size-14 flex-none items-center justify-center rounded-2xl bg-white/15 font-head text-lg font-extrabold">
            {firstName[0]}
            {lastName[0]}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-head text-xl font-extrabold tracking-tight">
                {firstName} {lastName}
              </p>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-head text-[11px] font-bold">
                {plan === "free" ? "Free plan" : "Member"}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/75">
              {sector && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="size-3.5" /> {sector}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" /> {city}
              </span>
            </div>
          </div>
        </div>

        {roles.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-medium text-white/70">Looking for</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {roles.map((role) => (
                <li
                  key={role}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium"
                >
                  {role}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-auto pt-6">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <p className="font-head font-bold">Profile {strength}% complete</p>
            <Link
              href={`${CANDIDATE_HOME}/resume`}
              className="flex-none font-head text-xs font-bold text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              Complete profile
            </Link>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${strength}%` }}
            />
          </div>
          {nextStep && (
            <p className="mt-2 text-xs text-white/70">
              Next: {nextStep.label.toLowerCase()} to stand out to employers.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white/10 p-5 md:w-64 md:flex-none">
        <div>
          <p className="text-xs font-medium text-white/70">Next interview</p>
          <p className="mt-1.5 font-head text-lg font-bold tracking-tight">
            Taj
          </p>
          <p className="text-sm text-white/80">Front Office Executive</p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-white/75">
            <CalendarClock className="size-3.5" /> Thu, 25 Sep · 11:00 AM
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/75">
            <Video className="size-3.5" /> Video call
          </p>
        </div>
        <Button
          size="sm"
          className="w-full bg-white font-head text-brand hover:bg-white/90"
          nativeButton={false}
          render={<Link href={`${CANDIDATE_HOME}/interviews`} />}
        >
          Prepare now
        </Button>
      </div>
    </section>
  );
}

function InterviewGuarantee() {
  const used = INTERVIEWS.filter((i) => i.state !== "open").length;
  return (
    <section className="flex min-w-0 flex-col rounded-3xl border border-border bg-card p-6">
      <p className="font-head text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
        Membership perk
      </p>
      <h2 className="mt-1 font-head text-lg font-bold tracking-tight">
        3 guaranteed interviews
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {used} of 3 used — one more is waiting for the right role.
      </p>

      <ol className="mt-5 grid flex-1 gap-3 sm:grid-cols-3 xl:grid-cols-1 xl:content-start">
        {INTERVIEWS.map((item, i) => (
          <li key={i} className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-10 flex-none items-center justify-center rounded-full font-head text-sm font-extrabold",
                item.state === "done" && "bg-good text-white",
                item.state === "scheduled" &&
                  "bg-brand/10 text-brand ring-2 ring-brand",
                item.state === "open" &&
                  "border-2 border-dashed border-border text-muted-foreground",
              )}
            >
              {item.state === "done" ? (
                <Check className="size-4.5" strokeWidth={3} />
              ) : (
                i + 1
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate font-head text-sm font-bold">
                {item.company ?? "Open slot"}
                {item.state === "scheduled" && (
                  <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] text-brand">
                    Upcoming
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{item.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Pipeline() {
  const max = Math.max(...PIPELINE, 1);
  return (
    <ol className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {STAGES.map((stage, i) => (
        <li key={stage} className="min-w-0">
          <div className="flex h-20 items-end rounded-xl bg-muted/60 p-1 sm:h-24">
            <div
              className={cn(
                "w-full rounded-lg transition-all",
                PIPELINE[i] === 0
                  ? "h-1 bg-border"
                  : i >= 3
                    ? "bg-good/80"
                    : "bg-brand",
              )}
              style={
                PIPELINE[i]
                  ? {
                      height: `${Math.max((PIPELINE[i] / max) * 100, 12)}%`,
                      opacity: 1 - i * 0.12,
                    }
                  : undefined
              }
            />
          </div>
          <p className="mt-2 font-head text-lg font-extrabold tracking-tight sm:text-xl">
            {PIPELINE[i]}
          </p>
          <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
            {stage}
          </p>
        </li>
      ))}
    </ol>
  );
}

function StageMeter({ stage, closed }: { stage: number; closed?: boolean }) {
  return (
    <div
      className="flex flex-1 gap-1 sm:w-28 sm:flex-none"
      role="img"
      aria-label={
        closed
          ? "Closed"
          : `Stage ${stage + 1} of ${STAGES.length}: ${STAGES[stage]}`
      }
    >
      {STAGES.map((s, i) => (
        <span
          key={s}
          className={cn(
            "h-1.5 flex-1 rounded-full",
            closed
              ? "bg-muted-foreground/25"
              : i <= stage
                ? stage >= 3
                  ? "bg-good"
                  : "bg-brand"
                : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-24 flex-none">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden>
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="8"
          className="stroke-muted"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className="stroke-brand"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-head text-xl font-extrabold tracking-tight">
          {value}%
        </span>
        <span className="text-[10px] text-muted-foreground">complete</span>
      </div>
    </div>
  );
}

function Card({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-head font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Chip({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
      <Icon className="size-3 flex-none" />
      <span className="truncate">{children}</span>
    </span>
  );
}
