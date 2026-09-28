import Link from "next/link";
import { ArrowRight, Search, Send } from "lucide-react";

import { Panel, StageMeter } from "@/components/candidate/dashboard-ui";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { CompanyAvatar } from "@/components/company-avatar";
import { Button } from "@/components/ui/button";
import {
  STAGES,
  formatShortDate,
  type Application,
} from "@/lib/candidate-activity";
import { cn } from "@/lib/utils";

const MIN_ROWS = 4;

export function ApplicationJourney({
  applications,
  sector,
  matchingRoles,
}: {
  applications: Application[];
  sector?: string;
  matchingRoles: number;
}) {
  return (
    <Panel
      title="Application journey"
      description="Where each of your applications stands"
      className="flex flex-col"
      action={
        applications.length > 0 && (
          <Link
            href={`${CANDIDATE_HOME}/applications`}
            className="inline-flex flex-none items-center gap-1 font-head text-sm font-bold whitespace-nowrap text-brand hover:text-brand-dark"
          >
            View all <ArrowRight className="size-3.5" />
          </Link>
        )
      }
    >
      {applications.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Send className="size-5" />
          </span>
          <p className="mt-4 font-head font-bold tracking-tight">
            No applications yet
          </p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Apply in one click and track every step, from viewed to offer, right
            here.
          </p>
          <Button
            className="mt-5 bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href="/jobs" />}
          >
            Find jobs <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border border-t border-border">
            {applications.map(({ id, job, stage, appliedOn, status }) => {
              const closed = status !== "active";
              return (
                <li
                  key={id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5"
                >
                  <CompanyAvatar name={job.company} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`${CANDIDATE_HOME}/applications/${id}`}
                      className="block truncate font-head text-sm font-bold hover:text-brand"
                    >
                      {job.designation}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {job.company} · {job.location} · Applied{" "}
                      {formatShortDate(appliedOn)}
                    </p>
                  </div>
                  <div className="flex w-full items-center gap-3 pl-14 sm:w-auto sm:pl-0">
                    <StageMeter stage={stage} closed={closed} />
                    <span
                      className={cn(
                        "w-20 text-right font-head text-xs font-bold",
                        closed
                          ? "text-muted-foreground"
                          : stage >= 3
                            ? "text-good"
                            : "text-brand",
                      )}
                    >
                      {status === "rejected"
                        ? "Not selected"
                        : closed
                          ? "Closed"
                          : STAGES[stage]}
                    </span>
                  </div>
                </li>
              );
            })}
            {Array.from(
              { length: Math.max(MIN_ROWS - applications.length, 0) },
              (_, i) => (
                <li
                  key={`placeholder-${i}`}
                  aria-hidden
                  className="flex items-center gap-4 py-3.5"
                >
                  <span className="size-10 flex-none rounded-full border-2 border-dashed border-border" />
                  <div className="min-w-0 flex-1">
                    {i === 0 ? (
                      <>
                        <p className="font-head text-sm font-bold text-muted-foreground">
                          Your next application
                        </p>
                        <p className="text-xs text-muted-foreground/80">
                          Shows up here with its live stage
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="block h-2.5 w-40 max-w-full rounded-full bg-muted" />
                        <span className="mt-2 block h-2 w-56 max-w-full rounded-full bg-muted/70" />
                      </>
                    )}
                  </div>
                  <StageMeter
                    stage={-1}
                    className="hidden opacity-60 sm:flex"
                  />
                  <span className="hidden w-20 sm:block" />
                </li>
              ),
            )}
          </ul>

          <div className="mt-auto pt-5">
            <div className="flex flex-col gap-4 rounded-2xl bg-linear-to-br from-brand/8 to-brand-accent/12 p-4 sm:flex-row sm:items-center sm:p-5">
              <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-card text-brand shadow-sm">
                <Search className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-head text-sm font-bold">
                  {matchingRoles > 0
                    ? [
                        matchingRoles,
                        sector,
                        matchingRoles === 1 ? "role matches" : "roles match",
                        "your profile",
                      ]
                        .filter(Boolean)
                        .join(" ")
                    : "New roles are added every day"}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  More applications mean more chances at a shortlist.
                </p>
              </div>
              <Button
                size="sm"
                className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                nativeButton={false}
                render={<Link href="/jobs" />}
              >
                Browse jobs <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
