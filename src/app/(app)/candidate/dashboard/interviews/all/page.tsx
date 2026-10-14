import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DashboardHeader } from "@/components/candidate/dashboard-ui";
import {
  InterviewsTable,
  type InterviewFilter,
  type InterviewRow,
} from "@/components/candidate/interviews-table";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { interviewPhase, relativeDay } from "@/lib/interviews";
import { listCandidateInterviews } from "@/server/applications/candidate";
import { requireMember } from "@/server/auth/current-candidate";

export const metadata = { title: "All interviews — JobClubb" };

const INTERVIEWS_PATH = `${CANDIDATE_HOME}/interviews`;

export default async function AllInterviewsPage({
  searchParams,
}: PageProps<"/candidate/dashboard/interviews/all">) {
  const { status } = await searchParams;
  const candidate = await requireMember(`${INTERVIEWS_PATH}/all`, {
    allowLapsed: true,
  });
  const interviews = await listCandidateInterviews(candidate.id);
  const now = new Date();

  const rows: InterviewRow[] = interviews.map((i) => {
    const phase = interviewPhase(i, now);
    return {
      ...i,
      past: phase === "ended",
      status: phase === "ended" ? (i.outcome ?? "Completed") : "Upcoming",
      when: phase === "live" ? "Live now" : relativeDay(i.startsAt, now),
    };
  });
  const initialFilter: InterviewFilter =
    status === "upcoming" || status === "completed" ? status : "all";

  return (
    <div className="space-y-6">
      <Link
        href={INTERVIEWS_PATH}
        className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Interviews
      </Link>

      <DashboardHeader
        title="All interviews"
        description="Every round you've been scheduled for. Times are in IST."
      />

      <InterviewsTable interviews={rows} initialFilter={initialFilter} />
    </div>
  );
}
