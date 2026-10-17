"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";

import { adminTableFeatures, DataTable, formatDate } from "@/components/admin/data-table";
import { FilterSelect } from "@/components/table-toolbar";
import { Badge } from "@/components/ui/badge";
import {
  ADMIN_PLACEMENT_LABELS,
  formatDateOnly,
  formatRupees,
  isClosed,
  placementBadge,
  type PlacementStatus,
} from "@/lib/placements";
import { cn } from "@/lib/utils";
import type { AdminPlacement } from "@/server/placements/placements";

const TABS = [
  { key: "open", label: "Open" },
  { key: "offer_received", label: "Ready to release" },
  { key: "awaiting_offer", label: "Awaiting offer" },
  { key: "released", label: "Awaiting payment" },
  { key: "accepted", label: "Paid" },
  { key: "replacement", label: "Replacement owed" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const inTab = (p: AdminPlacement, tab: TabKey) =>
  tab === "all" ||
  (tab === "replacement"
    ? p.replacement?.status === "owed"
    : tab === "open"
      ? !isClosed(p.status)
      : tab === "closed"
        ? isClosed(p.status)
        : p.status === tab);

const helper = createColumnHelper<typeof adminTableFeatures, AdminPlacement>();

const columns = helper.columns([
  helper.accessor("candidateName", {
    header: "Candidate",
    sortFn: "text",
    cell: ({ row }) => (
      <div className="min-w-44">
        <p className="font-head font-bold">{row.original.candidateName}</p>
        <p className="text-xs text-muted-foreground">
          <span className="font-mono">{row.original.ref}</span> · {row.original.candidatePhone}
        </p>
      </div>
    ),
  }),
  helper.accessor((p) => `${p.designation} ${p.companyName}`, {
    id: "role",
    header: "Role",
    sortFn: "text",
    cell: ({ row }) => (
      <div className="min-w-40">
        <p className="font-medium">{row.original.designation}</p>
        <p className="text-xs text-muted-foreground">{row.original.companyName}</p>
      </div>
    ),
  }),
  helper.accessor("status", {
    header: "Status",
    sortFn: "text",
    cell: ({ row, getValue }) => (
      <div className="flex flex-wrap gap-1.5">
        <Badge className={cn("font-head font-bold", placementBadge(getValue()))}>
          {ADMIN_PLACEMENT_LABELS[getValue()]}
        </Badge>
        {row.original.replacement?.status === "owed" && (
          <Badge className="bg-amber-500/12 font-head font-bold text-amber-700 dark:text-amber-300">
            Replacement owed
          </Badge>
        )}
      </div>
    ),
  }),
  helper.accessor((p) => p.fee ?? p.monthlySalary ?? 0, {
    id: "fee",
    header: "Fee",
    sortFn: "basic",
    cell: ({ row }) => {
      const amount = row.original.fee ?? row.original.monthlySalary;
      return (
        <span className="whitespace-nowrap text-muted-foreground">
          {amount ? formatRupees(amount) : "—"}
        </span>
      );
    },
  }),
  helper.accessor((p) => p.offerDeadline ?? "", {
    id: "deadline",
    header: "Pay by",
    sortFn: "text",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {row.original.releasedAt && row.original.offerDeadline
          ? formatDateOnly(row.original.offerDeadline)
          : "—"}
      </span>
    ),
  }),
  helper.accessor("selectedAt", {
    header: "Selected",
    sortFn: "basic",
    sortDescFirst: true,
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-muted-foreground">{formatDate(getValue())}</span>
    ),
  }),
]);

const COLUMN_CLASS: Record<string, string> = {
  role: "hidden md:table-cell",
  fee: "hidden lg:table-cell",
  deadline: "hidden xl:table-cell",
  selectedAt: "hidden sm:table-cell",
};

export function PlacementsTable({ placements }: { placements: AdminPlacement[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("open");
  const count = (status: PlacementStatus) => placements.filter((p) => p.status === status).length;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Ready to release" value={count("offer_received")} highlight={count("offer_received") > 0} />
        <StatTile label="Awaiting offer" value={count("awaiting_offer")} />
        <StatTile label="Awaiting payment" value={count("released")} />
        <StatTile label="Paid, not yet joined" value={count("accepted")} />
      </div>
      <DataTable
        key={tab}
        data={placements.filter((p) => inTab(p, tab))}
        columns={columns}
        getRowId={(p) => p.id}
        searchable={["candidateName", "role"]}
        searchPlaceholder="Search candidate, role or company"
        initialSort={{ id: "selectedAt", desc: true }}
        columnClass={COLUMN_CLASS}
        onRowClick={(p) => router.push(`/admin/placements/${p.id}`)}
        emptyTitle="No placements in this view"
        toolbar={
          <FilterSelect
            label="Status"
            options={TABS.map((t) => ({ value: t.key, label: t.label }))}
            value={tab}
            onChange={setTab}
          />
        }
      />
    </>
  );
}

function StatTile({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card px-4 py-3.5",
        highlight && "border-amber-500/40 bg-amber-500/5",
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-head text-2xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}
