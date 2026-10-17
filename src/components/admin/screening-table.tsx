"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";

import { adminTableFeatures, DataTable, formatDate } from "@/components/admin/data-table";
import { FilterSelect } from "@/components/table-toolbar";
import { Badge } from "@/components/ui/badge";
import { formatExperienceMonths } from "@/lib/company-activity";
import { formatIst } from "@/lib/interviews";
import { cn } from "@/lib/utils";
import {
  SCREENING_BADGES,
  SCREENING_LABELS,
  type ScreeningApplication,
  type ScreeningState,
} from "@/lib/screening";

const TABS = [
  { key: "open", label: "Needs JobClubb" },
  { key: "new", label: "To screen" },
  { key: "interview", label: "JobClubb interview" },
  { key: "shortlisted", label: "Ready to refer" },
  { key: "referred", label: "With employer" },
  { key: "not_selected", label: "Not selected" },
  { key: "all", label: "All" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const OPEN: ScreeningState[] = ["new", "interview", "shortlisted"];

const inTab = (state: ScreeningState, tab: TabKey) =>
  tab === "all" || (tab === "open" ? OPEN.includes(state) : state === tab);

const helper = createColumnHelper<typeof adminTableFeatures, ScreeningApplication>();

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
  helper.accessor((a) => `${a.designation} ${a.companyName}`, {
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
  helper.accessor("state", {
    header: "Status",
    sortFn: "text",
    cell: ({ row }) => {
      const a = row.original;
      return (
        <Badge className={cn("font-head font-bold", SCREENING_BADGES[a.state])}>
          {a.state === "not_selected"
            ? `Not selected by ${a.rejectedBy === "employer" ? "employer" : "JobClubb"}`
            : a.state === "interview" && a.interviewAt
              ? `Interview ${formatIst(a.interviewAt, { day: "numeric", month: "short" })}`
              : SCREENING_LABELS[a.state]}
        </Badge>
      );
    },
  }),
  helper.accessor("experienceMonths", {
    header: "Experience",
    sortFn: "basic",
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {formatExperienceMonths(getValue())}
      </span>
    ),
  }),
  helper.accessor("city", {
    header: "City",
    sortFn: "text",
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
  }),
  helper.accessor("appliedOn", {
    header: "Applied",
    sortFn: "basic",
    sortDescFirst: true,
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-muted-foreground">{formatDate(getValue())}</span>
    ),
  }),
]);

const COLUMN_CLASS: Record<string, string> = {
  role: "hidden md:table-cell",
  experienceMonths: "hidden lg:table-cell",
  city: "hidden xl:table-cell",
  appliedOn: "hidden sm:table-cell",
};

export function ScreeningTable({ applications }: { applications: ScreeningApplication[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("open");
  const count = (state: ScreeningState) => applications.filter((a) => a.state === state).length;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="To screen" value={count("new")} highlight={count("new") > 0} />
        <StatTile label="JobClubb interview" value={count("interview")} />
        <StatTile label="Ready to refer" value={count("shortlisted")} highlight={count("shortlisted") > 0} />
        <StatTile label="With employer" value={count("referred")} />
      </div>
      <DataTable
        key={tab}
        data={applications.filter((a) => inTab(a.state, tab))}
        columns={columns}
        getRowId={(a) => a.ref}
        searchable={["candidateName", "role"]}
        searchPlaceholder="Search candidate, role or company"
        initialSort={{ id: "appliedOn", desc: true }}
        columnClass={COLUMN_CLASS}
        onRowClick={(a) => router.push(`/admin/applications/${a.ref}`)}
        emptyTitle="No applications in this view"
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
