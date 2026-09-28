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
import { APPLICATIONS, STAGES } from "@/lib/candidate-activity";
import { cn } from "@/lib/utils";
import { requireMember } from "@/server/auth/current-candidate";

export const metadata = { title: "Applications — JobClubb" };

export default async function ApplicationsPage() {
  await requireMember(`${CANDIDATE_HOME}/applications`);

  const active = APPLICATIONS.filter((a) => a.status === "active");
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
          value={APPLICATIONS.length}
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
          value={`${Math.round(
            (APPLICATIONS.filter((a) => a.stage >= 1).length /
              APPLICATIONS.length) *
              100,
          )}%`}
          note="Viewed by employers"
          icon={Briefcase}
          tone="muted"
        />
      </div>

      <section
        aria-label="Active pipeline"
        className="rounded-3xl bg-linear-to-br from-brand-surface to-brand-surface-strong p-5 text-white sm:p-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-head font-bold tracking-tight">
            Active pipeline
          </h2>
          <p className="text-xs text-white/70">
            How far your {active.length} open applications have reached
          </p>
        </div>
        <ol className="mt-5 grid grid-cols-5 gap-2 sm:gap-3">
          {STAGES.map((stage, i) => (
            <li key={stage} className="relative min-w-0">
              <div
                className={cn(
                  "h-1.5 rounded-full",
                  pipeline[i] > 0 ? "bg-white" : "bg-white/20",
                )}
                style={pipeline[i] > 0 ? { opacity: 1 - i * 0.12 } : undefined}
              />
              <p className="mt-3 font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
                {pipeline[i]}
              </p>
              <p className="truncate text-[11px] text-white/75 sm:text-xs">
                {stage}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <ApplicationsTable applications={APPLICATIONS} />
    </div>
  );
}
