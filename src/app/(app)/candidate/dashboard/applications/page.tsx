import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CalendarCheck,
  Hourglass,
  Send,
} from "lucide-react";

import { ApplicationsTable } from "@/components/candidate/applications-table";
import { DashboardHeader, StatTile } from "@/components/candidate/dashboard-ui";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { Button } from "@/components/ui/button";
import { STAGES } from "@/lib/candidate-activity";
import { cn } from "@/lib/utils";
import { listCandidateApplications } from "@/server/applications/candidate";
import { requireMember } from "@/server/auth/current-candidate";

export const metadata = { title: "Applications — JobClubb" };

export default async function ApplicationsPage() {
  const candidate = await requireMember(`${CANDIDATE_HOME}/applications`);
  const applications = await listCandidateApplications(candidate.id);

  const active = applications.filter((a) => a.status === "active");
  const interviewing = active.filter((a) => a.stage >= 3).length;
  const pipeline = STAGES.map(
    (_, i) => active.filter((a) => a.stage >= i).length,
  );

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Applications"
        description="Track every role you've applied to, from first view to offer."
        action={
          <Button
            className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href="/jobs" />}
          >
            Find more jobs
            <ArrowRight className="size-4" />
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Total applied"
          value={applications.length}
          note="Since you joined"
          icon={Send}
        />
        <StatTile
          label="In progress"
          value={active.length}
          note="Awaiting employer action"
          icon={Hourglass}
        />
        <StatTile
          label="Interviews"
          value={interviewing}
          note="Scheduled or completed"
          icon={CalendarCheck}
          tone="good"
        />
        <StatTile
          label="Response rate"
          value={
            applications.length
              ? `${Math.round(
                  (applications.filter((a) => a.stage >= 1).length /
                    applications.length) *
                    100,
                )}%`
              : "—"
          }
          note="Viewed by employers"
          icon={Briefcase}
          tone="muted"
        />
      </div>

      <ApplicationsTable applications={applications} />
    </div>
  );
}
