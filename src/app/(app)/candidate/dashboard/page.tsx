import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  Check,
  Eye,
  FileText,
  Heart,
  MapPin,
  Sparkles,
  Send,
  Video,
} from "lucide-react";

import { ApplicationJourney } from "@/components/candidate/application-journey";
import { CandidateAvatar } from "@/components/candidate/candidate-avatar";
import { EmptyState, Panel } from "@/components/candidate/dashboard-ui";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { Button } from "@/components/ui/button";
import {
  APPLICATIONS,
  GUARANTEED_INTERVIEWS,
  SAVED_JOBS,
  formatInterviewDate,
  formatInterviewTime,
  guaranteeSlots,
  upcomingInterviews,
  type Interview,
} from "@/lib/candidate-activity";
import { greeting } from "@/lib/greeting";
import { VERTICALS } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import type { MembershipPlan } from "@/lib/membership";
import type { Resume } from "@/lib/resume";
import { requireMember } from "@/server/auth/current-candidate";
import { getCandidatePhotoUrl } from "@/server/candidates/photo";
import { getSavedResume } from "@/server/resume/ats-resume";

export const metadata = { title: "Dashboard — JobClubb" };

// Email and location are required at sign-up (requireMember only lets
// verified candidates through), so they always count as done.
function profileChecklist(resume: Resume | undefined, hasPhoto: boolean) {
  return [
    { label: "Verify email address", done: true },
    { label: "Add home location", done: true },
    { label: "Generate ATS resume", done: !!resume },
    // Freshers have no work history, so education counts too.
    {
      label: "Add experience or education",
      done: !!resume && resume.experience.length + resume.education.length > 0,
    },
    { label: "Upload a profile photo", done: hasPhoto },
  ];
}

export default async function CandidateDashboard() {
  const candidate = await requireMember(CANDIDATE_HOME);
  const vertical = VERTICALS.find((v) => v.slug === candidate.vertical);
  const sector = vertical?.name;
  const now = new Date();

  const [photoUrl, saved] = await Promise.all([
    getCandidatePhotoUrl(candidate.photo_path),
    getSavedResume(candidate.id),
  ]);
  const checklist = profileChecklist(saved?.resume, !!candidate.photo_path);
  const completed = checklist.filter((c) => c.done).length;
  const strength = Math.round((completed / checklist.length) * 100);

  const inReview = APPLICATIONS.filter((a) => a.status === "active").length;
  const upcoming = upcomingInterviews(now);
  const weekAhead = upcoming.filter(
    (i) => +new Date(i.startsAt) - +now < 7 * 86_400_000,
  ).length;
  const recent = APPLICATIONS.slice(0, 4);
  const stats = [
    {
      label: "Applications sent",
      value: APPLICATIONS.length,
      note: "Since you joined",
      icon: Send,
    },
    {
      label: "Profile views",
      value: "—",
      note: "Shows once employers view you",
      icon: Eye,
    },
    {
      label: "In review",
      value: inReview,
      note: "Awaiting employer reply",
      icon: Briefcase,
    },
    {
      label: "Saved jobs",
      value: SAVED_JOBS.length,
      note: `${SAVED_JOBS.filter((j) => j.closesInDays <= 5).length} closing soon`,
      icon: Heart,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
            {greeting(now)}, {candidate.first_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {weekAhead + inReview === 0 ? (
              "Apply to roles you like and track every step right here."
            ) : (
              <>
                You have{" "}
                <span className="font-semibold text-foreground">
                  {weekAhead} {weekAhead === 1 ? "interview" : "interviews"}
                </span>{" "}
                this week and{" "}
                <span className="font-semibold text-foreground">
                  {inReview} {inReview === 1 ? "application" : "applications"}
                </span>{" "}
                in review.
              </>
            )}
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
          photoUrl={photoUrl}
          city={candidate.city}
          sector={sector}
          roles={vertical?.roles.slice(0, 4) ?? []}
          strength={strength}
          nextStep={checklist.find((c) => !c.done)?.label}
          nextInterview={upcoming[0]}
        />
        <InterviewGuarantee />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon }) => (
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
        <ApplicationJourney
          applications={recent}
          sector={sector}
          matchingRoles={0}
        />

        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title="Profile strength"
            description="Stronger profiles get shortlisted faster"
          >
            <div className="flex items-center gap-5">
              <Ring value={strength} />
              <ul className="min-w-0 flex-1 space-y-2">
                {checklist.map((item) => (
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
          </Panel>

          <Panel
            title="Your location"
            description="Matching jobs within 25 km"
            className="flex-1"
            action={
              <Link
                href={`${CANDIDATE_HOME}/settings`}
                className="flex-none font-head text-sm font-bold text-brand hover:text-brand-dark"
              >
                Change
              </Link>
            }
          >
            <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
              <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-brand-accent/15 text-good">
                <MapPin className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-head text-sm font-bold">
                  {candidate.city}, {candidate.pincode}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {sector ? `${sector} roles` : "Roles"} near you show up first.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-head text-lg font-bold tracking-tight">
              Picked for you
            </h2>
          </div>
          <Link
            href="/jobs"
            className="inline-flex flex-none items-center gap-1 font-head text-sm font-bold text-brand hover:text-brand-dark"
          >
            All jobs <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          action={
            <Button
              className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
              nativeButton={false}
              render={<Link href="/jobs" />}
            >
              Browse jobs
            </Button>
          }
        >
          {sector ? `${sector} roles` : "Roles"} matched to your profile and
          location will show up here.
        </EmptyState>
      </section>
    </div>
  );
}

function ProfileSummary({
  firstName,
  lastName,
  photoUrl,
  city,
  sector,
  roles,
  strength,
  nextStep,
  plan,
  nextInterview,
}: {
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  city: string;
  sector?: string;
  roles: string[];
  strength: number;
  nextStep?: string;
  plan: MembershipPlan;
  nextInterview?: Interview;
}) {
  return (
    <section
      aria-label="Your profile"
      className="flex min-w-0 flex-col gap-6 rounded-3xl bg-linear-to-br from-brand-surface to-brand-surface-strong p-6 text-white sm:p-7 md:flex-row md:items-stretch"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-4">
          <CandidateAvatar
            firstName={firstName}
            lastName={lastName}
            photoUrl={photoUrl}
            className="size-14 rounded-2xl bg-white/15 text-lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-head text-xl font-extrabold tracking-tight">
                {firstName} {lastName}
              </p>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-head text-[11px] font-bold">
                {plan === "franchise" ? "Franchise member" : "Member"}
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
              Next: {nextStep.toLowerCase()} to stand out to employers.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white/10 p-5 md:w-64 md:flex-none">
        {nextInterview ? (
          <div>
            <p className="text-xs font-medium text-white/70">Next interview</p>
            <p className="mt-1.5 font-head text-lg font-bold tracking-tight">
              {nextInterview.company}
            </p>
            <p className="text-sm text-white/80">{nextInterview.role}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-white/75">
              <CalendarClock className="size-3.5" />{" "}
              {formatInterviewDate(nextInterview.startsAt)} ·{" "}
              {formatInterviewTime(nextInterview.startsAt)}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/75">
              <Video className="size-3.5" /> {nextInterview.mode}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium text-white/70">Next interview</p>
            <p className="mt-1.5 text-sm text-white/80">
              Nothing scheduled yet. Keep applying — shortlisted roles lead to
              interviews.
            </p>
          </div>
        )}
        <Button
          size="sm"
          className="w-full bg-white font-head text-brand hover:bg-white/90"
          nativeButton={false}
          render={<Link href={`${CANDIDATE_HOME}/interviews`} />}
        >
          {nextInterview ? "Prepare now" : "View interviews"}
        </Button>
      </div>
    </section>
  );
}

function InterviewGuarantee() {
  const slots = guaranteeSlots(new Date());
  const used = slots.filter((i) => i.state !== "open").length;
  const left = GUARANTEED_INTERVIEWS - used;
  return (
    <section className="flex min-w-0 flex-col rounded-3xl border border-border bg-card p-6">
      <p className="font-head text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
        Membership perk
      </p>
      <h2 className="mt-1 font-head text-lg font-bold tracking-tight">
        {GUARANTEED_INTERVIEWS} guaranteed interviews
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {used} of {GUARANTEED_INTERVIEWS} used
        {left > 0
          ? ` — ${left === 1 ? "one more is" : `${left} more are`} waiting for the right role.`
          : "."}
      </p>

      <ol className="mt-5 grid flex-1 gap-3 sm:grid-cols-3 xl:grid-cols-1 xl:content-start">
        {slots.map((item, i) => (
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
