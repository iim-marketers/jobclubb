import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DashboardHeader } from "@/components/candidate/dashboard-ui";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { SavedJobsGrid } from "@/components/candidate/saved-jobs-grid";
import { Button } from "@/components/ui/button";
import { SAVED_JOBS } from "@/lib/candidate-activity";
import { listCandidateApplications } from "@/server/applications/candidate";
import { requireMember } from "@/server/auth/current-candidate";

export const metadata = { title: "Saved jobs — JobClubb" };

export default async function SavedJobsPage() {
  const candidate = await requireMember(`${CANDIDATE_HOME}/saved`);
  const applications = await listCandidateApplications(candidate.id);
  const closingSoon = SAVED_JOBS.filter((s) => s.closesInDays <= 5).length;

  return (
    <div className="space-y-6 ">
      <DashboardHeader
        title="Saved jobs"
        description={
          closingSoon > 0 ? (
            <>
              You&apos;ve saved {SAVED_JOBS.length} roles, and{" "}
              <span className="font-semibold text-foreground">
                {closingSoon} close this week
              </span>
              . Apply before they&apos;re gone.
            </>
          ) : (
            "Roles you've bookmarked to come back to."
          )
        }
        action={
          <Button
            variant="outline"
            className="font-head"
            nativeButton={false}
            render={<Link href="/jobs" />}
          >
            Browse jobs
            <ArrowRight className="size-4" />
          </Button>
        }
      />

      <SavedJobsGrid
        saved={SAVED_JOBS}
        appliedSlugs={applications.map((a) => a.job.slug)}
      />
    </div>
  );
}
