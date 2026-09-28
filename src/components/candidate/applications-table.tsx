"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  useTable,
  type Column,
} from "@tanstack/react-table";

import { EmptyState, StageMeter } from "@/components/candidate/dashboard-ui";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { CompanyAvatar } from "@/components/company-avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  applicationStatus,
  formatShortDate,
  type Application,
} from "@/lib/candidate-activity";
import { cn } from "@/lib/utils";

const features = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, basic: sortFn_basic },
  filterFns: { includesString: filterFn_includesString },
});

const SEARCHABLE = new Set(["role", "company", "location"]);
const PAGE_SIZE = 8;

const TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "In progress" },
  { key: "interview", label: "Interviews" },
  { key: "archived", label: "Archived" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function inTab(a: Application, tab: TabKey) {
  if (tab === "active") return a.status === "active";
  if (tab === "interview") return a.status === "active" && a.stage >= 3;
  if (tab === "archived") return a.status !== "active";
  return true;
}

export const applicationHref = (id: string) =>
  `${CANDIDATE_HOME}/applications/${id}`;

const helper = createColumnHelper<typeof features, Application>();

const columns = helper.columns([
  helper.accessor((a) => a.job.designation, {
    id: "role",
    header: "Role",
    sortFn: "text",
    cell: ({ row }) => {
      const a = row.original;
      const archived = a.status !== "active";
      return (
        <div className="flex min-w-0 items-center gap-3">
          <CompanyAvatar
            name={a.job.company}
            className={cn("size-9", archived && "opacity-60 grayscale")}
          />
          <div className="min-w-0">
            <Link
              href={applicationHref(a.id)}
              className={cn(
                "block truncate font-head font-bold hover:text-brand focus-visible:underline focus-visible:outline-none",
                archived && "text-muted-foreground",
              )}
            >
              {a.job.designation}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {a.job.company}
              <span className="md:hidden"> · {a.job.location}</span>
            </p>
          </div>
        </div>
      );
    },
  }),
  helper.accessor((a) => a.job.company, {
    id: "company",
    header: "Company",
    sortFn: "text",
  }),
  helper.accessor((a) => a.job.location, {
    id: "location",
    header: "Location",
    sortFn: "text",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()}</span>
    ),
  }),
  helper.accessor("appliedOn", {
    header: "Applied",
    sortFn: "alphanumeric",
    sortDescFirst: true,
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{formatShortDate(getValue())}</span>
    ),
  }),
  helper.accessor((a) => (a.status === "active" ? a.stage : -1), {
    id: "stage",
    header: "Status",
    sortFn: "basic",
    sortDescFirst: true,
    cell: ({ row }) => {
      const a = row.original;
      const archived = a.status !== "active";
      return (
        <div className="flex items-center gap-3">
          <StageMeter stage={a.stage} closed={archived} className="w-20 flex-none sm:w-20" />
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-head text-[11px] font-bold",
              archived
                ? "bg-muted text-muted-foreground"
                : a.stage >= 3
                  ? "bg-good/12 text-good"
                  : "bg-brand/10 text-brand",
            )}
          >
            {applicationStatus(a)}
          </span>
        </div>
      );
    },
  }),
  helper.accessor("updatedAgo", {
    header: "Last update",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()}</span>
    ),
  }),
  helper.display({
    id: "open",
    header: () => <span className="sr-only">Open</span>,
    cell: () => (
      <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-brand" />
    ),
  }),
]);

const COLUMN_CLASS: Record<string, string> = {
  role: "min-w-56 pl-4 sm:pl-5",
  company: "hidden xl:table-cell",
  location: "hidden md:table-cell",
  appliedOn: "hidden sm:table-cell",
  updatedAgo: "hidden lg:table-cell",
  open: "w-10 pr-4 sm:pr-5",
};

export function ApplicationsTable({
  applications,
}: {
  applications: Application[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("all");
  const data = useMemo(
    () => applications.filter((a) => inTab(a, tab)),
    [applications, tab],
  );

  const table = useTable({
    features,
    columns,
    data,
    getRowId: (a) => a.id,
    globalFilterFn: "includesString",
    getColumnCanGlobalFilter: (column) => SEARCHABLE.has(column.id),
    initialState: {
      sorting: [{ id: "appliedOn", desc: true }],
      pagination: { pageIndex: 0, pageSize: PAGE_SIZE },
    },
  });

  const query = String(table.state.globalFilter ?? "");
  const rows = table.getRowModel().rows;
  const total = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.state.pagination;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <section aria-label="Your applications" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filter applications"
          className="flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1"
        >
          {TABS.map((t) => {
            const count = applications.filter((a) => inTab(a, t.key)).length;
            const selected = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setTab(t.key);
                  table.setPageIndex(0);
                }}
                className={cn(
                  "flex flex-none items-center gap-1.5 rounded-full px-3.5 py-1.5 font-head text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5",
                    selected ? "bg-white/20" : "bg-muted",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            placeholder="Search role, company or city"
            aria-label="Search applications"
            className="h-10 w-full rounded-full border border-border bg-card pr-4 pl-10 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-3 focus:ring-brand/15"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={query ? "No matching applications" : "Nothing here yet"}
          action={
            query ? (
              <Button
                variant="outline"
                className="font-head"
                onClick={() => table.setGlobalFilter("")}
              >
                Clear search
              </Button>
            ) : (
              <Button
                className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                nativeButton={false}
                render={<Link href="/jobs" />}
              >
                Browse jobs
              </Button>
            )
          }
        >
          {query
            ? "Try a different role, company or city."
            : "Applications you send will show up here with live status updates."}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="hover:bg-transparent">
                  {group.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      aria-sort={ariaSort(header.column)}
                      className={cn(
                        "h-11 px-3 text-xs font-semibold text-muted-foreground",
                        COLUMN_CLASS[header.column.id],
                      )}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="-ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <table.FlexRender header={header} />
                          <SortIcon column={header.column} />
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("a, button")) return;
                    router.push(applicationHref(row.id));
                  }}
                  className="group/row cursor-pointer"
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn("px-3 py-3.5", COLUMN_CLASS[cell.column.id])}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
            <p className="text-xs text-muted-foreground">
              Showing {from}–{to} of {total}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Page {pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous page"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next page"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

type AppColumn = Column<typeof features, Application, unknown>;

function ariaSort(column: AppColumn) {
  const sorted = column.getIsSorted();
  if (!column.getCanSort()) return undefined;
  return sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none";
}

function SortIcon({ column }: { column: AppColumn }) {
  const sorted = column.getIsSorted();
  if (sorted === "asc") return <ArrowUp className="size-3.5 text-foreground" />;
  if (sorted === "desc") return <ArrowDown className="size-3.5 text-foreground" />;
  return <ArrowUpDown className="size-3.5 opacity-50" />;
}
