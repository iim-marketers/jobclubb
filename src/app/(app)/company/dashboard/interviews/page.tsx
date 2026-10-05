import Link from "next/link";
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  MapPin,
  Phone,
  Video,
} from "lucide-react";

import {
  DashboardHeader,
  EmptyState,
  Panel,
  StatTile,
} from "@/components/candidate/dashboard-ui";
import { COMPANY_HOME } from "@/components/company/nav";
import { Button } from "@/components/ui/button";
import {
  formatInterviewDate,
  formatInterviewTime,
  type InterviewMode,
} from "@/lib/candidate-activity";
import {
  pastCompanyInterviews,
  upcomingCompanyInterviews,
  type CompanyInterview,
} from "@/lib/company-activity";
import { requireCompany } from "@/server/auth/current-company";

export const metadata = { title: "Interviews — JobClubb" };

const MODE_ICONS: Record<InterviewMode, typeof Video> = {
  "Video call": Video,
  "In person": MapPin,
  Phone: Phone,
};

export default async function CompanyInterviewsPage() {
  await requireCompany(`${COMPANY_HOME}/interviews`);
  const now = new Date();
  const upcoming = upcomingCompanyInterviews(now);
  const past = pastCompanyInterviews(now);
  const thisWeek = upcoming.filter(
    (i) => +new Date(i.startsAt) - +now < 7 * 86_400_000,
  ).length;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Interviews"
        description="Interviews with shortlisted applicants, in India Standard Time."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatTile
          label="This week"
          value={thisWeek}
          note="Next 7 days"
          icon={CalendarClock}
        />
        <StatTile
          label="Upcoming"
          value={upcoming.length}
          note="All scheduled"
          icon={CalendarCheck}
          tone="good"
        />
        <StatTile
          label="Completed"
          value={past.length}
          note="Since you joined"
          icon={CheckCircle2}
          tone="muted"
        />
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No interviews scheduled"
          action={
            <Button
              variant="outline"
              className="font-head"
              nativeButton={false}
              render={<Link href={`${COMPANY_HOME}/applicants`} />}
            >
              Review applicants
            </Button>
          }
        >
          Shortlist applicants for a role and their interviews will be listed
          here.
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Upcoming" description={`${upcoming.length} scheduled`}>
            <InterviewList interviews={upcoming} empty="Nothing scheduled right now." />
          </Panel>
          <Panel title="Past" description="Most recent first">
            <InterviewList interviews={past} empty="No completed interviews yet." />
          </Panel>
        </div>
      )}
    </div>
  );
}

function InterviewList({
  interviews,
  empty,
}: {
  interviews: CompanyInterview[];
  empty: string;
}) {
  if (interviews.length === 0)
    return <p className="text-sm text-muted-foreground">{empty}</p>;

  return (
    <ul className="space-y-3">
      {interviews.map((i) => {
        const Icon = MODE_ICONS[i.mode];
        return (
          <li
            key={i.id}
            className="flex items-center gap-4 rounded-2xl border border-border p-4"
          >
            <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-head text-sm font-bold">
                {i.designation} · {i.round}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                <span className="font-mono">{i.applicantRef}</span> · {i.mode} ·{" "}
                {i.place}
              </p>
            </div>
            <div className="flex-none text-right">
              <p className="font-head text-sm font-bold">
                {formatInterviewDate(i.startsAt)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatInterviewTime(i.startsAt)} · {i.durationMins} min
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
