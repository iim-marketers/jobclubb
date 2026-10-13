import Link from "next/link";
import { Handshake, UserRoundCheck } from "lucide-react";

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
import { PlacementRowActions } from "@/components/company/placement-actions";
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
import {
  COMPANY_PLACEMENT_LABELS,
  formatDateOnly,
  isClosed,
  isReleased,
  placementBadge,
  todayIst,
} from "@/lib/placements";
import { cn } from "@/lib/utils";
import { requireCompany } from "@/server/auth/current-company";
import {
  listCompanyPlacements,
  type CompanyPlacement,
} from "@/server/placements/placements";

export const metadata = { title: "Selected candidates — JobClubb" };

const COLUMNS = [
  { key: "candidate", label: "Candidate", className: "min-w-52 pl-4 sm:pl-5" },
  { key: "job", label: "Selected for", className: "hidden lg:table-cell" },
  { key: "status", label: "Status", className: "" },
  { key: "joining", label: "Joining", className: "hidden md:table-cell" },
  {
    key: "selectedOn",
    label: "Selected on",
    className: "hidden xl:table-cell",
  },
  {
    key: "actions",
    label: "Actions",
    className: "w-px pr-3 text-right whitespace-nowrap sm:pr-4",
  },
] as const;

const cellClass = (key: (typeof COLUMNS)[number]["key"]) =>
  COLUMNS.find((c) => c.key === key)!.className;

export default async function SelectedPage() {
  const company = await requireCompany(COMPANY_SELECTED);
  const placements = await listCompanyPlacements(company.id);
  const today = todayIst();

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Selected"
        description="Candidates you selected, and where each offer stands. Upload the offer letter and JobClubb takes it from there."
      />

      {placements.length === 0 ? (
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
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {placements.map((p) => (
                <TableRow key={p.id}>
                  <TableCell
                    className={cn("px-3 py-3.5", cellClass("candidate"))}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 flex-none items-center justify-center rounded-full bg-good/12 text-good">
                        <UserRoundCheck className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={applicantHref(p.ref)}
                          className="block truncate font-head font-bold hover:text-brand focus-visible:underline focus-visible:outline-none"
                        >
                          {p.candidate}
                        </Link>
                        <p className="truncate text-xs whitespace-nowrap text-muted-foreground">
                          <span className="font-mono">{p.ref}</span>
                          <span className="lg:hidden"> · {p.designation}</span>
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={cn("px-3 py-3.5", cellClass("job"))}>
                    <Link
                      href={jobApplicantsHref(p.jobId)}
                      className="block max-w-56 truncate text-muted-foreground hover:text-brand"
                    >
                      {p.designation}
                    </Link>
                  </TableCell>
                  <TableCell className={cn("px-3 py-3.5", cellClass("status"))}>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 font-head text-xs font-bold whitespace-nowrap",
                        placementBadge(p.status),
                      )}
                    >
                      {COMPANY_PLACEMENT_LABELS[p.status]}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn("px-3 py-3.5", cellClass("joining"))}
                  >
                    <span className="whitespace-nowrap text-muted-foreground">
                      {p.joiningDate ? formatDateOnly(p.joiningDate) : "—"}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn("px-3 py-3.5", cellClass("selectedOn"))}
                  >
                    <span className="whitespace-nowrap text-muted-foreground">
                      {formatShortDate(p.selectedAt)}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn("px-3 py-3.5", cellClass("actions"))}
                  >
                    <PlacementActions placement={p} today={today} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="flex items-start gap-2 rounded-2xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
        <Handshake className="mt-0.5 size-3.5 flex-none" />
        JobClubb shares your offer with the selected candidate and handles the
        placement. Their phone number and email stay private, and under our
        terms offers to candidates found on JobClubb go through JobClubb.
      </p>
    </div>
  );
}

function PlacementActions({
  placement: p,
  today,
}: {
  placement: CompanyPlacement;
  today: string;
}) {
  if (isClosed(p.status)) return null;
  const preRelease = !isReleased(p.status);
  return (
    <PlacementRowActions
      placementId={p.id}
      candidate={p.candidate}
      offer={
        preRelease
          ? {
              monthlySalary: p.monthlySalary,
              joiningDate: p.joiningDate,
              offerDeadline: p.offerDeadline,
              notes: p.notes,
              documents: p.documents,
            }
          : undefined
      }
      joiningDue={
        p.status === "accepted" && !!p.joiningDate && p.joiningDate <= today
      }
      canWithdraw={p.status !== "accepted"}
      candidateKnows={!preRelease}
    />
  );
}
