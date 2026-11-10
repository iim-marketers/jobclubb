"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { adminTableFeatures, DataTable, formatDate } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import {
  COMMISSION_KIND_LABELS,
  COMMISSION_STATE_BADGES,
  COMMISSION_STATE_LABELS,
} from "@/lib/franchise";
import { formatDateOnly, formatRupees, todayIst } from "@/lib/placements";
import { cn } from "@/lib/utils";
import type { Commission } from "@/server/franchises/ledger";

const helper = createColumnHelper<typeof adminTableFeatures, Commission>();

const baseColumns = helper.columns([
  helper.accessor("candidateName", {
    header: "Candidate",
    sortFn: "text",
    cell: ({ row }) => (
      <div className="min-w-36">
        <p className="font-head font-bold">{row.original.candidateName}</p>
        <p className="text-xs text-muted-foreground">{COMMISSION_KIND_LABELS[row.original.kind]}</p>
      </div>
    ),
  }),
  helper.accessor("baseAmount", {
    header: "Candidate paid",
    sortFn: "basic",
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-muted-foreground">{formatRupees(getValue())}</span>
    ),
  }),
  helper.accessor("amount", {
    header: "Commission",
    sortFn: "basic",
    cell: ({ getValue }) => (
      <span className={cn("font-head font-bold whitespace-nowrap", getValue() < 0 && "text-destructive")}>
        {formatRupees(getValue())}
      </span>
    ),
  }),
  helper.accessor("state", {
    header: "Status",
    sortFn: "text",
    cell: ({ row }) => (
      <div className="flex flex-col items-start gap-0.5">
        <Badge className={cn("font-head font-bold", COMMISSION_STATE_BADGES[row.original.state])}>
          {COMMISSION_STATE_LABELS[row.original.state]}
        </Badge>
        {row.original.state === "outstanding" && (
          <span
            className={cn(
              "text-[11px]",
              row.original.dueOn < todayIst() ? "font-semibold text-destructive" : "text-muted-foreground",
            )}
          >
            Due {formatDateOnly(row.original.dueOn)}
          </span>
        )}
        {row.original.reversalReason && (
          <span className="max-w-48 truncate text-[11px] text-muted-foreground" title={row.original.reversalReason}>
            {row.original.reversalReason}
          </span>
        )}
      </div>
    ),
  }),
  helper.accessor("earnedAt", {
    header: "Earned",
    sortFn: "basic",
    sortDescFirst: true,
    cell: ({ getValue }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(getValue())}</span>,
  }),
]);

export function CommissionsTable({
  commissions,
  renderActions,
  pageSize,
}: {
  commissions: Commission[];
  renderActions?: (commission: Commission) => React.ReactNode;
  pageSize?: number;
}) {
  const columns = renderActions
    ? [
        ...baseColumns,
        helper.display({
          id: "actions",
          header: "",
          cell: ({ row }) => renderActions(row.original),
        }),
      ]
    : baseColumns;
  return (
    <DataTable
      data={commissions}
      columns={columns}
      getRowId={(c) => c.id}
      searchable={["candidateName"]}
      searchPlaceholder="Search candidate"
      initialSort={{ id: "earnedAt", desc: true }}
      columnClass={{ baseAmount: "hidden md:table-cell", earnedAt: "hidden sm:table-cell" }}
      emptyTitle="No commission yet"
      pageSize={pageSize}
    />
  );
}
