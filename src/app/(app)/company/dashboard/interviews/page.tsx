import Link from "next/link";
import { ArrowRight, CalendarCheck, CalendarClock, CheckCircle2, Hourglass } from "lucide-react";

import { AccordionSections } from "@/components/accordion-sections";
import { DashboardHeader, EmptyState, StatTile } from "@/components/candidate/dashboard-ui";
import {
  INTERVIEW_VIEWS,
  InterviewRow,
  byDay,
  interviewViewHref,
  splitInterviews,
  type InterviewView,
} from "@/components/company/interview-list";
import { COMPANY_APPLICANTS, COMPANY_INTERVIEWS } from "@/components/company/nav";
import { Button } from "@/components/ui/button";
import type { CompanyInterview } from "@/lib/company-activity";
import { formatIst, relativeDay } from "@/lib/interviews";
import { cn } from "@/lib/utils";
import { listCompanyInterviews } from "@/server/applications/company";
import { requireCompany } from "@/server/auth/current-company";

export const metadata = { title: "Interviews — JobClubb" };

const PREVIEW = 3;

export default async function CompanyInterviewsPage() {
  const company = await requireCompany(COMPANY_INTERVIEWS);
  const interviews = await listCompanyInterviews(company.id);
  const now = new Date();
  const groups = splitInterviews(interviews, now);
  const { upcoming, completed } = groups;
  const awaiting = groups["awaiting-result"];
  const thisWeek = upcoming.filter(
    (i) => +new Date(i.startsAt) - +now < 7 * 86_400_000,
  ).length;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Interviews"
        description="Interviews with shortlisted applicants, in India Standard Time."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="This week" value={thisWeek} note="Next 7 days" icon={CalendarClock} />
        <StatTile
          label="Upcoming"
          value={upcoming.length}
          note="All scheduled"
          icon={CalendarCheck}
          tone="good"
        />
        <StatTile
          label="Awaiting result"
          value={awaiting.length}
          note={awaiting.length ? "Needs your update" : "All caught up"}
          icon={Hourglass}
        />
        <StatTile
          label="Completed"
          value={completed.length}
          note="Result recorded"
          icon={CheckCircle2}
          tone="muted"
        />
      </div>

      {interviews.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No interviews scheduled"
          action={
            <Button
              variant="outline"
              className="font-head"
              nativeButton={false}
              render={<Link href={COMPANY_APPLICANTS} />}
            >
              Review applicants
            </Button>
          }
        >
          Shortlist an applicant, then schedule their interview from their
          profile. It will be listed here.
        </EmptyState>
      ) : (
        <AccordionSections
          defaultOpen={awaiting.length > 0 ? "awaiting-result" : "upcoming"}
          sections={[
            {
              value: "awaiting-result",
              title: "Waiting for your result",
              description: "Let these applicants know where they stand.",
              badge: <CountBadge count={awaiting.length} tone="amber" />,
              content: <SectionList view="awaiting-result" interviews={awaiting} now={now} />,
            },
            {
              value: "upcoming",
              title: "Upcoming",
              description: upcoming.length
                ? `${upcoming.length} scheduled · ${thisWeek} this week`
                : "Nothing scheduled right now.",
              badge: <CountBadge count={upcoming.length} tone="brand" />,
              content: <SectionList view="upcoming" interviews={upcoming} now={now} />,
            },
            {
              value: "completed",
              title: "Completed",
              description: "Result recorded, most recent first.",
              badge: <CountBadge count={completed.length} tone="muted" />,
              content: <SectionList view="completed" interviews={completed} now={now} />,
            },
          ]}
        />
      )}
    </div>
  );
}

function CountBadge({ count, tone }: { count: number; tone: "amber" | "brand" | "muted" }) {
  return (
    <span
      className={cn(
        "flex h-6 min-w-6 flex-none items-center justify-center rounded-full px-2 font-head text-xs font-bold tabular-nums",
        count === 0 || tone === "muted"
          ? "bg-muted text-muted-foreground"
          : tone === "amber"
            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
            : "bg-brand/10 text-brand",
      )}
    >
      {count}
    </span>
  );
}

function SectionList({
  view,
  interviews,
  now,
}: {
  view: InterviewView;
  interviews: CompanyInterview[];
  now: Date;
}) {
  const shown = interviews.slice(0, PREVIEW);
  const more = interviews.length > PREVIEW;
  const past = view !== "upcoming";

  return (
    <div className="p-5 sm:p-6">
      {more && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Showing {PREVIEW} of {interviews.length}
          </p>
          <Link
            href={interviewViewHref(view)}
            className="inline-flex flex-none items-center gap-1 font-head text-sm font-bold text-brand hover:text-brand-dark"
          >
            See all <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}
      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {view === "upcoming"
            ? "Schedule an interview from a shortlisted applicant's profile."
            : INTERVIEW_VIEWS[view].empty}
        </p>
      ) : view === "upcoming" ? (
        <div className="space-y-6">
          {byDay(shown).map((day) => (
            <div key={day[0].startsAt}>
              <p className="mb-3 flex items-baseline gap-2 font-head text-sm font-bold">
                {formatIst(day[0].startsAt, { weekday: "long", day: "numeric", month: "long" })}
                <span className="text-xs font-semibold text-brand">
                  {relativeDay(day[0].startsAt, now)}
                </span>
              </p>
              <ul className="space-y-3">
                {day.map((i) => (
                  <InterviewRow key={i.id} interview={i} now={now} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((i) => (
            <InterviewRow key={i.id} interview={i} now={now} past={past} />
          ))}
        </ul>
      )}
    </div>
  );
}
