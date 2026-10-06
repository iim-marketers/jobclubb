import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Hourglass,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  User,
  Video,
} from "lucide-react";

import {
  DashboardHeader,
  EmptyState,
  Panel,
  StatTile,
} from "@/components/candidate/dashboard-ui";
import { InterviewCountdown } from "@/components/candidate/interview-countdown";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { PrepChecklist } from "@/components/candidate/prep-checklist";
import { CompanyAvatar } from "@/components/company-avatar";
import { Button } from "@/components/ui/button";
import {
  GUARANTEED_INTERVIEWS,
  INTERVIEWS,
  applicationFor,
  formatInterviewTime,
  pastInterviews,
  upcomingInterviews,
  type Interview,
  type InterviewMode,
} from "@/lib/candidate-activity";
import { INDUSTRIES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { requireMember } from "@/server/auth/current-candidate";

export const metadata = { title: "Interviews — JobClubb" };

const IST = "Asia/Kolkata";
const DAY_MS = 86_400_000;

const MODE_ICONS: Record<InterviewMode, typeof Video> = {
  "Video call": Video,
  "In person": MapPin,
  Phone: Phone,
};

const TIPS: Record<string, string[]> = {
  airlines: [
    "Grooming is assessed from the moment you walk in: hair tied, neutral makeup, formal fit.",
    "Prepare a 60-second introduction that ends with why you want to fly.",
    "Expect a situational question on handling an unruly or anxious passenger.",
  ],
  hotels: [
    "Use guest-first language: “I'd make sure the guest felt heard, then…”.",
    "Know the property: its star rating, brands, and one recent guest review.",
    "Be ready to role-play a check-in or a complaint at the front desk.",
  ],
};

const DEFAULT_TIPS = [
  "Research the employer's outlets or routes, and mention one by name.",
  "Structure answers as situation, action and result, in under a minute each.",
  "Keep two questions ready for them, such as training and growth paths.",
];

function istParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: IST,
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

const pad = (n: number) => String(n).padStart(2, "0");

function dayKey(d: Date) {
  const { year, month, day } = istParts(d);
  return `${year}-${pad(month)}-${pad(day)}`;
}

const fmt = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-IN", { ...options, timeZone: IST }).format(
    new Date(iso),
  );

function endsAt(i: Interview) {
  return new Date(new Date(i.startsAt).getTime() + i.durationMins * 60_000);
}

function timeRange(i: Interview) {
  return `${formatInterviewTime(i.startsAt)} – ${formatInterviewTime(endsAt(i).toISOString())}`;
}

function relativeDay(iso: string, now: Date) {
  const days = Math.round(
    (Date.parse(`${dayKey(new Date(iso))}T00:00:00Z`) -
      Date.parse(`${dayKey(now)}T00:00:00Z`)) /
      DAY_MS,
  );
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `In ${days} days` : `${-days} days ago`;
}

function calendarLink(i: Interview) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${i.company} interview — ${i.role}`,
    dates: `${stamp(new Date(i.startsAt))}/${stamp(endsAt(i))}`,
    details: `${i.round} with ${i.interviewer}. Scheduled via JobClubb.`,
    location: i.place,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function directionsLink(i: Interview) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(i.place)}`;
}

export default async function InterviewsPage() {
  const candidate = await requireMember(`${CANDIDATE_HOME}/interviews`);
  const now = new Date();
  const upcoming = upcomingInterviews(now);
  const past = pastInterviews(now);
  const next = upcoming[0];
  const guaranteedUsed = INTERVIEWS.filter((i) => i.guaranteed).length;
  const thisWeek = upcoming.filter(
    (i) => new Date(i.startsAt).getTime() - now.getTime() < 7 * DAY_MS,
  ).length;
  const tips = TIPS[candidate.industry] ?? DEFAULT_TIPS;
  const sector = INDUSTRIES.find((v) => v.slug === candidate.industry)?.name;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Interviews"
        description={
          next ? (
            <>
              Your next interview is with{" "}
              <span className="font-semibold text-foreground">
                {next.company}
              </span>{" "}
              {relativeDay(next.startsAt, now).toLowerCase()}. Prepare early and
              join 5 minutes before the start time.
            </>
          ) : (
            "Interviews employers schedule with you will appear here."
          )
        }
        action={
          <Button
            variant="outline"
            className="font-head"
            nativeButton={false}
            render={<Link href={`${CANDIDATE_HOME}/applications`} />}
          >
            My applications
            <ArrowRight className="size-4" />
          </Button>
        }
      />

      {next ? (
        <NextInterview interview={next} now={now} />
      ) : (
        <EmptyState
          icon={CalendarCheck}
          title="No interviews scheduled"
          action={
            <Button
              className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
              nativeButton={false}
              render={<Link href="/jobs" />}
            >
              Find jobs
            </Button>
          }
        >
          Once an employer shortlists you, the interview details land here.
        </EmptyState>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Upcoming"
          value={upcoming.length}
          note={`${thisWeek} this week`}
          icon={CalendarClock}
        />
        <StatTile
          label="Completed"
          value={past.length}
          note={`${past.filter((i) => i.outcome === "Awaiting result").length} awaiting result`}
          icon={CheckCircle2}
          tone="good"
        />
        <StatTile
          label="Guaranteed left"
          value={`${GUARANTEED_INTERVIEWS - guaranteedUsed}/${GUARANTEED_INTERVIEWS}`}
          note="Membership perk"
          icon={ShieldCheck}
        />
        <StatTile
          label="Hours booked"
          value={(
            upcoming.reduce((sum, i) => sum + i.durationMins, 0) / 60
          ).toFixed(1)}
          note="Across upcoming rounds"
          icon={Hourglass}
          tone="muted"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title="Schedule"
            description="Every round, in order. Times are in IST."
            className={cn("flex flex-col", !next && "flex-1")}
          >
            <Agenda title="Upcoming" interviews={upcoming} now={now} />
            {past.length > 0 && (
              <div className="mt-8">
                <Agenda title="Completed" interviews={past} now={now} past />
              </div>
            )}
          </Panel>

          {next && (
            <Panel
              title="Prep checklist"
              description={`Get ready for ${next.company} · ${next.round}`}
              className="flex-1"
            >
              <PrepChecklist interviewId={next.id} mode={next.mode} />
            </Panel>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <MonthCalendar
            interviews={INTERVIEWS}
            focus={next ? new Date(next.startsAt) : now}
            now={now}
          />

          {next && (
            <Panel
              title="Interview tips"
              description={
                sector
                  ? `What ${sector} recruiters look for`
                  : "What recruiters look for"
              }
              className="flex-1"
            >
              <ol className="space-y-4">
                {tips.map((tip, i) => (
                  <li key={tip} className="flex gap-3 text-sm leading-6">
                    <span className="flex size-6 flex-none items-center justify-center rounded-full bg-brand/10 font-head text-xs font-extrabold text-brand">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ol>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function NextInterview({
  interview: i,
  now,
}: {
  interview: Interview;
  now: Date;
}) {
  const ModeIcon = MODE_ICONS[i.mode];
  const application = applicationFor(i.jobSlug);

  return (
    <section
      aria-label="Next interview"
      className="grid overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
    >
      <div className="relative overflow-hidden bg-linear-to-br from-brand-surface to-brand-surface-strong p-6 text-white sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/8 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-10 size-72 rounded-full bg-brand-accent/20 blur-3xl"
        />
        <div className="relative flex h-full flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-head text-[11px] font-bold">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-accent opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-brand-accent" />
              </span>
              Next up · {relativeDay(i.startsAt, now)}
            </span>
            {i.guaranteed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-accent/25 px-2.5 py-1 font-head text-[11px] font-bold">
                <ShieldCheck className="size-3" /> Guaranteed interview
              </span>
            )}
          </div>

          <div className="flex items-start gap-4">
            <CompanyAvatar
              name={i.company}
              className="size-14 rounded-2xl text-base ring-2 ring-white/25"
            />
            <div className="min-w-0">
              <p className="font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
                {i.company}
              </p>
              <p className="mt-0.5 text-sm text-white/80">{i.role}</p>
            </div>
          </div>

          <div className="mt-auto">
            <p className="mb-2 text-xs font-medium text-white/70">Starts in</p>
            <InterviewCountdown
              startsAt={i.startsAt}
              serverNow={now.getTime()}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col p-6 sm:p-7">
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem icon={CalendarClock} label="Date">
            {fmt(i.startsAt, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </DetailItem>
          <DetailItem icon={Clock} label="Time">
            {timeRange(i)}{" "}
            <span className="text-muted-foreground">
              ({i.durationMins} min)
            </span>
          </DetailItem>
          <DetailItem icon={ModeIcon} label={i.mode} className="sm:col-span-2">
            {i.place}
          </DetailItem>
          <DetailItem icon={User} label="Interviewer" className="sm:col-span-2">
            {i.interviewer} · {i.round}
          </DetailItem>
        </dl>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
          <Button
            className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={
              <a
                href={calendarLink(i)}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <CalendarPlus className="size-4" /> Add to calendar
          </Button>
          {i.mode === "In person" && (
            <Button
              variant="outline"
              className="font-head"
              nativeButton={false}
              render={
                <a
                  href={directionsLink(i)}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <Navigation className="size-4" /> Directions
            </Button>
          )}
          {application && (
            <Button
              variant="ghost"
              className="font-head text-brand"
              nativeButton={false}
              render={
                <Link
                  href={`${CANDIDATE_HOME}/applications/${application.id}`}
                />
              }
            >
              <FileText className="size-4" /> Application
            </Button>
          )}
        </div>
        {i.mode === "Video call" && (
          <p className="mt-3 text-xs text-muted-foreground">
            The meeting link is emailed to you 1 hour before the interview.
          </p>
        )}
      </div>
    </section>
  );
}

function DetailItem({
  icon: Icon,
  label,
  className,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex gap-3", className)}>
      <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}

function Agenda({
  title,
  interviews,
  now,
  past,
}: {
  title: string;
  interviews: Interview[];
  now: Date;
  past?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <p className="mb-3 font-head text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
        {title} · {interviews.length}
      </p>
      {interviews.length === 0 ? (
        <p className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Nothing scheduled right now.
        </p>
      ) : (
        <ol className="space-y-3">
          {interviews.map((i) => (
            <AgendaItem key={i.id} interview={i} now={now} past={past} />
          ))}
        </ol>
      )}
    </div>
  );
}

function AgendaItem({
  interview: i,
  now,
  past,
}: {
  interview: Interview;
  now: Date;
  past?: boolean;
}) {
  const ModeIcon = MODE_ICONS[i.mode];
  const application = applicationFor(i.jobSlug);

  return (
    <li className="flex gap-3 sm:gap-4">
      <div
        className={cn(
          "flex w-14 flex-none flex-col items-center justify-center rounded-2xl py-2 text-center sm:w-16",
          past ? "bg-muted text-muted-foreground" : "bg-brand/10 text-brand",
        )}
      >
        <span className="font-head text-[10px] font-bold tracking-wide uppercase">
          {fmt(i.startsAt, { month: "short" })}
        </span>
        <span className="font-head text-2xl leading-7 font-extrabold">
          {fmt(i.startsAt, { day: "numeric" })}
        </span>
        <span className="text-[10px] font-semibold">
          {fmt(i.startsAt, { weekday: "short" })}
        </span>
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 rounded-2xl border border-border p-4 transition-colors",
          !past && "hover:border-brand/40",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <CompanyAvatar name={i.company} className="size-9" />
            <div className="min-w-0">
              <p className="truncate font-head text-sm font-bold">
                {i.company}{" "}
                <span className="font-medium text-muted-foreground">
                  · {i.round}
                </span>
              </p>
              <p className="truncate text-xs text-muted-foreground">{i.role}</p>
            </div>
          </div>
          <StatusPill interview={i} now={now} past={past} />
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" /> {timeRange(i)}
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <ModeIcon className="size-3.5 flex-none" />
            <span className="truncate">
              {i.mode === "In person" ? i.place : i.mode}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <User className="size-3.5" /> {i.interviewer}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3">
          {!past && (
            <a
              href={calendarLink(i)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-head text-xs font-bold text-brand hover:text-brand-dark hover:underline"
            >
              Add to calendar
            </a>
          )}
          {!past && i.mode === "In person" && (
            <a
              href={directionsLink(i)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-head text-xs font-bold text-brand hover:text-brand-dark hover:underline"
            >
              Directions
            </a>
          )}
          {application && (
            <Link
              href={`${CANDIDATE_HOME}/applications/${application.id}`}
              className="inline-flex items-center gap-1 font-head text-xs font-bold text-brand hover:text-brand-dark hover:underline"
            >
              View application
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

function StatusPill({
  interview: i,
  now,
  past,
}: {
  interview: Interview;
  now: Date;
  past?: boolean;
}) {
  if (!past)
    return (
      <span className="rounded-full bg-brand/10 px-2.5 py-1 font-head text-[11px] font-bold text-brand">
        {relativeDay(i.startsAt, now)}
      </span>
    );
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 font-head text-[11px] font-bold",
        i.outcome === "Cleared"
          ? "bg-good/12 text-good"
          : i.outcome === "Not selected"
            ? "bg-muted text-muted-foreground"
            : "bg-amber-500/12 text-amber-700 dark:text-amber-300",
      )}
    >
      {i.outcome ?? "Completed"}
    </span>
  );
}

function MonthCalendar({
  interviews,
  focus,
  now,
}: {
  interviews: Interview[];
  focus: Date;
  now: Date;
}) {
  const { year, month } = istParts(focus);
  const firstWeekday =
    (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const today = dayKey(now);
  const byDay = new Map<string, Interview[]>();
  for (const i of interviews) {
    const key = dayKey(new Date(i.startsAt));
    byDay.set(key, [...(byDay.get(key) ?? []), i]);
  }
  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-head font-bold tracking-tight">{monthLabel}</h2>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-brand" /> Upcoming
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-good" /> Done
          </span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, n) => (
          <span
            key={n}
            className="pb-1 font-head text-[11px] font-bold text-muted-foreground"
          >
            {d}
          </span>
        ))}
        {Array.from({ length: firstWeekday }, (_, n) => (
          <span key={`pad-${n}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, n) => {
          const day = n + 1;
          const key = `${year}-${pad(month)}-${pad(day)}`;
          const booked = byDay.get(key);
          const isPast = booked && new Date(booked[0].startsAt) < now;
          return (
            <span
              key={key}
              title={booked
                ?.map(
                  (b) => `${b.company} · ${formatInterviewTime(b.startsAt)}`,
                )
                .join("\n")}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-xl text-sm tabular-nums",
                booked
                  ? isPast
                    ? "bg-good/12 font-head font-bold text-good"
                    : "bg-brand font-head font-bold text-brand-foreground"
                  : "text-foreground/80",
                key === today && !booked && "font-bold ring-2 ring-brand/40",
                key === today &&
                  booked &&
                  "ring-2 ring-offset-2 ring-brand ring-offset-card",
              )}
            >
              {day}
              {booked && booked.length > 1 && (
                <span className="absolute right-1 bottom-1 size-1.5 rounded-full bg-current" />
              )}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function GuaranteeTracker({ used }: { used: number }) {
  const left = Math.max(GUARANTEED_INTERVIEWS - used, 0);
  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-head text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
            Membership perk
          </p>
          <h2 className="mt-1 font-head font-bold tracking-tight">
            {GUARANTEED_INTERVIEWS} guaranteed interviews
          </h2>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        {Array.from({ length: GUARANTEED_INTERVIEWS }, (_, n) => (
          <span
            key={n}
            className={cn(
              "flex h-11 flex-1 items-center justify-center rounded-xl font-head text-sm font-extrabold",
              n < used
                ? "bg-good text-white"
                : "border-2 border-dashed border-border text-muted-foreground",
            )}
          >
            {n < used ? <Check className="size-4.5" strokeWidth={3} /> : n + 1}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {left > 0
          ? `${used} used, ${left} left. We'll line one up when you apply to a matching role.`
          : "You've used all your guaranteed interviews."}
      </p>
    </section>
  );
}
