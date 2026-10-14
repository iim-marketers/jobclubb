import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DashboardHeader } from "@/components/candidate/dashboard-ui";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { SavedJobsGrid } from "@/components/candidate/saved-jobs-grid";
import { Button } from "@/components/ui/button";
import { listCandidateApplications } from "@/server/applications/candidate";
import { requireMember } from "@/server/auth/current-candidate";
import { listSavedJobs } from "@/server/candidates/saved-jobs";

export const metadata = { title: "Saved jobs — JobClubb" };

export default async function SavedJobsPage() {
  const candidate = await requireMember(`${CANDIDATE_HOME}/saved`);
  const [saved, applications] = await Promise.all([
    listSavedJobs(candidate.id),
    listCandidateApplications(candidate.id),
  ]);
  const applied = Object.fromEntries(
    applications.map((a) => [a.job.slug, a.id]),
  );
  const toApply = saved.filter((s) => !s.closed && !applied[s.job.slug]).length;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Saved jobs"
        description={
          toApply > 0 ? (
            <>
              You have{" "}
              <span className="font-semibold text-foreground">
                {toApply} saved {toApply === 1 ? "role" : "roles"}
              </span>{" "}
              you haven&apos;t applied to yet. Apply while they&apos;re still
              open.
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

      <SavedJobsGrid saved={saved} applied={applied} />
    </div>
  );
}
