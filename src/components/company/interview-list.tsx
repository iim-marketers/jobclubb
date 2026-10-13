import Link from "next/link";
import { CalendarClock, ChevronRight, MapPin, Phone, User, Video } from "lucide-react";

import { COMPANY_APPLICANTS, COMPANY_INTERVIEWS } from "@/components/company/nav";
import type { InterviewMode } from "@/lib/candidate-activity";
import {
  pastCompanyInterviews,
  upcomingCompanyInterviews,
  type CompanyInterview,
} from "@/lib/company-activity";
import { formatIst, interviewPhase, istDateTime, relativeDay } from "@/lib/interviews";
import { NOT_SELECTED_BADGE } from "@/lib/status-badge";
import { cn } from "@/lib/utils";

export const INTERVIEW_VIEWS = {
  "awaiting-result": {
    title: "Waiting for your result",
    description: "Past interviews that still need a result, most recent first.",
    empty: "You're all caught up.",
  },
  upcoming: {
    title: "Upcoming interviews",
    description: "Scheduled and live interviews, soonest first.",
    empty: "Nothing scheduled right now.",
  },
  completed: {
    title: "Completed interviews",
    description: "Interviews with a recorded result, most recent first.",
    empty: "No completed interviews yet.",
  },
} as const;

export type InterviewView = keyof typeof INTERVIEW_VIEWS;

export const interviewViewHref = (view: InterviewView) => `${COMPANY_INTERVIEWS}/${view}`;

export const applicantInterviewHref = (ref: string) =>
  `${COMPANY_APPLICANTS}/${ref}?section=interview`;

export function splitInterviews(interviews: CompanyInterview[], now: Date) {
  const past = pastCompanyInterviews(interviews, now);
  return {
    upcoming: upcomingCompanyInterviews(interviews, now),
    "awaiting-result": past.filter((i) => !i.outcome),
    completed: past.filter((i) => i.outcome),
  } satisfies Record<InterviewView, CompanyInterview[]>;
}

export const MODE_ICONS: Record<InterviewMode, typeof Video> = {
  "Video call": Video,
  "In-person": MapPin,
  Phone: Phone,
};

const MEETING_HOSTS: Record<string, string> = {
  "meet.google.com": "Google Meet",
  "zoom.us": "Zoom",
  "teams.microsoft.com": "Microsoft Teams",
  "teams.live.com": "Microsoft Teams",
};

export function placeSummary(i: CompanyInterview) {
  if (i.venue) return i.venue.city;
  if (i.mode === "Phone") return i.place;
  try {
    const host = new URL(i.place).hostname.replace(/^www\./, "");
    return (
      MEETING_HOSTS[host] ??
      Object.entries(MEETING_HOSTS).find(([h]) => host.endsWith(`.${h}`))?.[1] ??
      host
    );
  } catch {
    return i.mode;
  }
}

export function byDay(interviews: CompanyInterview[]) {
  const days = new Map<string, CompanyInterview[]>();
  for (const i of interviews) {
    const key = istDateTime(i.startsAt).date;
    days.set(key, [...(days.get(key) ?? []), i]);
  }
  return [...days.values()];
}

export function InterviewStatusPill({ interview: i, now }: { interview: CompanyInterview; now: Date }) {
  const phase = interviewPhase(i, now);
  if (i.outcome)
    return (
      <span
        className={cn(
          "rounded-full px-2.5 py-1 font-head text-[11px] font-bold whitespace-nowrap",
          i.outcome === "Cleared" ? "bg-good/12 text-good" : NOT_SELECTED_BADGE,
        )}
      >
        {i.outcome}
      </span>
    );
  if (phase === "ended")
    return (
      <span className="rounded-full bg-amber-500 px-3 py-1.5 font-head text-xs font-bold whitespace-nowrap text-white transition-colors group-hover:bg-amber-600">
        Record result
      </span>
    );
  if (phase === "live")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-good/12 px-2.5 py-1 font-head text-[11px] font-bold whitespace-nowrap text-good">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-good opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex size-2 rounded-full bg-good" />
        </span>
        Live now
      </span>
    );
  return (
    <span className="rounded-full bg-brand/10 px-2.5 py-1 font-head text-[11px] font-bold whitespace-nowrap text-brand">
      {relativeDay(i.startsAt, now)}
    </span>
  );
}

export function InterviewRow({
  interview: i,
  now,
  past,
}: {
  interview: CompanyInterview;
  now: Date;
  past?: boolean;
}) {
  const ModeIcon = MODE_ICONS[i.mode];
  const [clock, meridiem] = formatIst(i.startsAt, { hour: "numeric", minute: "2-digit" }).split(/\s/);
  const scheduled = interviewPhase(i, now) === "upcoming";

  return (
    <li>
      <Link
        href={applicantInterviewHref(i.applicantRef)}
        className="group grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-card p-3.5 transition-colors hover:border-brand/40 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:p-4"
      >
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-xl py-2.5 text-center",
            past ? "bg-muted text-muted-foreground" : "bg-brand/10 text-brand",
          )}
        >
          {past ? (
            <>
              <span className="font-head text-xl leading-6 font-extrabold">
                {formatIst(i.startsAt, { day: "numeric" })}
              </span>
              <span className="font-head text-[11px] font-bold uppercase">
                {formatIst(i.startsAt, { month: "short" })}
              </span>
            </>
          ) : (
            <>
              <span className="font-head text-lg leading-6 font-extrabold">{clock}</span>
              <span className="font-head text-[11px] font-bold uppercase">
                {meridiem} · {i.durationMins}m
              </span>
            </>
          )}
        </div>

        <div className="min-w-0">
          <p className="font-head text-sm font-bold">
            {i.applicant}
            <span className="font-medium text-muted-foreground"> · {i.round}</span>
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{i.designation}</p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ModeIcon className="size-3.5 flex-none" />
              {i.mode} · {placeSummary(i)}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="size-3.5 flex-none" />
              {i.interviewer}
            </span>
            {past && (
              <span className="flex items-center gap-1.5">
                <CalendarClock className="size-3.5 flex-none" />
                {formatIst(i.startsAt, { hour: "numeric", minute: "2-digit" })} ·{" "}
                {relativeDay(i.startsAt, now)}
              </span>
            )}
          </p>
        </div>

        <div className="col-start-2 flex items-center gap-2 sm:col-start-3">
          {scheduled ? (
            <span className="font-head text-xs font-bold text-brand group-hover:underline">
              View applicant
            </span>
          ) : (
            <InterviewStatusPill interview={i} now={now} />
          )}
          <ChevronRight className="size-4 flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    </li>
  );
}
