import Link from "next/link";
import { ChevronRight, Handshake, UserRoundCheck } from "lucide-react";

import {
  DashboardHeader,
  EmptyState,
} from "@/components/candidate/dashboard-ui";
import {
  COMPANY_INTERVIEWS,
  applicantHref,
  COMPANY_SELECTED,
  jobApplicantsHref,
} from "@/components/company/nav";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatShortDate } from "@/lib/candidate-activity";
import { formatExperienceMonths } from "@/lib/company-activity";
import { cn } from "@/lib/utils";
import { listSelectedCandidates } from "@/server/applications/company";
import { requireCompany } from "@/server/auth/current-company";

export const metadata = { title: "Selected candidates — JobClubb" };

const COLUMNS = [
  { key: "candidate", label: "Candidate", className: "min-w-52 pl-4 sm:pl-5" },
  { key: "job", label: "Selected for", className: "hidden md:table-cell" },
  { key: "rounds", label: "Rounds", className: "hidden sm:table-cell" },
  { key: "experience", label: "Experience", className: "hidden lg:table-cell" },
  { key: "selectedOn", label: "Selected on", className: "" },
  { key: "open", label: "", className: "w-10 pr-4 sm:pr-5" },
] as const;

const cellClass = (key: (typeof COLUMNS)[number]["key"]) =>
  COLUMNS.find((c) => c.key === key)!.className;

export default async function SelectedPage() {
  const company = await requireCompany(COMPANY_SELECTED);
  const selected = await listSelectedCandidates(company.id);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Selected"
        description="Candidates you selected after their final interview round, most recent first."
      />

      {selected.length === 0 ? (
        <EmptyState
          icon={UserRoundCheck}
          title="No one selected yet"
          action={
            <Button
              variant="outline"
              className="font-head"
              nativeButton={false}
              render={<Link href={COMPANY_INTERVIEWS} />}
            >
              View interviews
            </Button>
          }
        >
          When you mark a candidate as selected after their final round, they
          show up here.
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                {COLUMNS.map((c) => (
                  <TableHead
                    key={c.key}
                    className={cn(
                      "h-11 px-3 text-xs font-semibold text-muted-foreground",
                      c.className,
                    )}
                  >
                    {c.label || <span className="sr-only">Open</span>}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {selected.map((s) => (
                <TableRow key={s.ref} className="group/row">
                  <TableCell className={cn("px-3 py-3.5", cellClass("candidate"))}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 flex-none items-center justify-center rounded-full bg-good/12 text-good">
                        <UserRoundCheck className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={applicantHref(s.ref)}
                          className="block truncate font-head font-bold hover:text-brand focus-visible:underline focus-visible:outline-none"
                        >
                          {s.name}
                        </Link>
                        <p className="truncate text-xs whitespace-nowrap text-muted-foreground">
                          <span className="font-mono">{s.ref}</span> · {s.city}
                          <span className="md:hidden"> · {s.designation}</span>
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={cn("px-3 py-3.5", cellClass("job"))}>
                    <Link
                      href={jobApplicantsHref(s.jobId)}
                      className="block max-w-56 truncate text-muted-foreground hover:text-brand"
                    >
                      {s.designation}
                    </Link>
                  </TableCell>
                  <TableCell className={cn("px-3 py-3.5", cellClass("rounds"))}>
                    <span className="whitespace-nowrap text-muted-foreground">
                      {s.rounds} {s.rounds === 1 ? "round" : "rounds"}
                    </span>
                  </TableCell>
                  <TableCell className={cn("px-3 py-3.5", cellClass("experience"))}>
                    <span className="whitespace-nowrap text-muted-foreground">
                      {formatExperienceMonths(s.experienceMonths)}
                    </span>
                  </TableCell>
                  <TableCell className={cn("px-3 py-3.5", cellClass("selectedOn"))}>
                    <span className="whitespace-nowrap text-muted-foreground">
                      {formatShortDate(s.selectedOn)}
                    </span>
                  </TableCell>
                  <TableCell className={cn("px-3 py-3.5", cellClass("open"))}>
                    <Link
                      href={applicantHref(s.ref)}
                      aria-label={`Open ${s.name}`}
                      className="flex justify-end"
                    >
                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-brand" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="flex items-start gap-2 rounded-2xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
        <Handshake className="mt-0.5 size-3.5 flex-none" />
        JobClubb gets in touch with each selected candidate about the offer.
        Their phone number and email stay private.
      </p>
    </div>
  );
}
