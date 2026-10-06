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

import { EmptyState } from "@/components/candidate/dashboard-ui";
import { COMPANY_JOBS } from "@/components/company/nav";
import { JobStatusPill } from "@/components/company/job-status";
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
  formatPostedDate,
  type CompanyJob,
  type JobStatus,
} from "@/lib/company-jobs";
import { cn } from "@/lib/utils";

const features = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    basic: sortFn_basic,
  },
  filterFns: { includesString: filterFn_includesString },
});

const SEARCHABLE = new Set(["designation", "role", "city"]);
const PAGE_SIZE = 10;

const TABS: { key: "all" | JobStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "in_review", label: "In review" },
  { key: "closed", label: "Closed" },
];

type TabKey = (typeof TABS)[number]["key"];

export type JobListItem = CompanyJob & { applicants: number };

const jobHref = (id: string) => `${COMPANY_JOBS}/${id}`;

const helper = createColumnHelper<typeof features, JobListItem>();

const columns = helper.columns([
  helper.accessor("designation", {
    header: "Job",
    sortFn: "text",
    cell: ({ row }) => {
      const job = row.original;
      return (
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <Link
              href={jobHref(job.id)}
              className="block truncate font-head font-bold hover:text-brand focus-visible:underline focus-visible:outline-none"
            >
              {job.designation}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {job.role}
              <span className="md:hidden"> · {job.city}</span>
            </p>
          </div>
        </div>
      );
    },
  }),
  helper.accessor("role", {
    header: "Role",
    sortFn: "text",
  }),
  helper.accessor("city", {
    header: "Location",
    sortFn: "text",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        <p>{row.original.city}</p>
        <p className="text-xs">
          {row.original.jobType} · {row.original.workMode}
        </p>
      </div>
    ),
  }),
  helper.accessor("status", {
    header: "Status",
    enableSorting: false,
    cell: ({ getValue }) => <JobStatusPill status={getValue()} />,
  }),
  helper.accessor("applicants", {
    header: "Applicants",
    sortFn: "basic",
    sortDescFirst: true,
    cell: ({ getValue }) => (
      <span className="font-head font-bold">{getValue()}</span>
    ),
  }),
  helper.accessor("openings", {
    header: "Openings",
    sortFn: "basic",
    sortDescFirst: true,
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()}</span>
    ),
  }),
  helper.accessor("createdAt", {
    header: "Posted",
    sortFn: "alphanumeric",
    sortDescFirst: true,
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {formatPostedDate(getValue())}
      </span>
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
  designation: "min-w-56 pl-4 sm:pl-5",
  role: "hidden xl:table-cell",
  city: "hidden md:table-cell",
  openings: "hidden lg:table-cell",
  createdAt: "hidden sm:table-cell",
  open: "w-10 pr-4 sm:pr-5",
};

export function JobsList({ jobs }: { jobs: JobListItem[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("all");
  const data = useMemo(
    () =>
      jobs.filter(
        (j) =>
          tab === "all" ||
          j.status === tab ||
          (tab === "closed" && j.status === "rejected"),
      ),
    [jobs, tab],
  );

  const table = useTable({
    features,
    columns,
    data,
    getRowId: (j) => j.id,
    globalFilterFn: "includesString",
    getColumnCanGlobalFilter: (column) => SEARCHABLE.has(column.id),
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
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
    <section aria-label="Your job postings" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filter job postings"
          className="flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1"
        >
          {TABS.map((t) => {
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
            placeholder="Search title, role or city"
            aria-label="Search job postings"
            className="h-10 w-full rounded-full border border-border bg-card pr-4 pl-10 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-3 focus:ring-brand/15"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={
            jobs.length === 0
              ? "No job postings yet"
              : query
                ? "No matching postings"
                : "Nothing here"
          }
          action={
            query ? (
              <Button
                variant="outline"
                className="font-head"
                onClick={() => table.setGlobalFilter("")}
              >
                Clear search
              </Button>
            ) : jobs.length === 0 ? (
              <Button
                className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                nativeButton={false}
                render={<Link href={`${COMPANY_JOBS}/new`} />}
              >
                Post your first job
              </Button>
            ) : undefined
          }
        >
          {jobs.length === 0
            ? "Post an opening and our team will review it before it goes live to members."
            : query
              ? "Try a different title, role or city."
              : "No postings have this status right now."}
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
                    router.push(jobHref(row.id));
                  }}
                  className="group/row cursor-pointer"
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "px-3 py-3.5",
                        COLUMN_CLASS[cell.column.id],
                      )}
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

type JobColumn = Column<typeof features, JobListItem, unknown>;

function ariaSort(column: JobColumn) {
  const sorted = column.getIsSorted();
  if (!column.getCanSort()) return undefined;
  return sorted === "asc"
    ? "ascending"
    : sorted === "desc"
      ? "descending"
      : "none";
}

function SortIcon({ column }: { column: JobColumn }) {
  const sorted = column.getIsSorted();
  if (sorted === "asc") return <ArrowUp className="size-3.5 text-foreground" />;
  if (sorted === "desc")
    return <ArrowDown className="size-3.5 text-foreground" />;
  return <ArrowUpDown className="size-3.5 opacity-50" />;
}
