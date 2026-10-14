"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Video,
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
  sortFn_text,
  tableFeatures,
  useTable,
  type Column,
} from "@tanstack/react-table";

import { EmptyState } from "@/components/candidate/dashboard-ui";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { CompanyAvatar } from "@/components/company-avatar";
import {
  FilterSelect,
  TableSearch,
  TableToolbar,
} from "@/components/table-toolbar";
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
  formatInterviewTime,
  type Interview,
  type InterviewMode,
} from "@/lib/candidate-activity";
import { NOT_SELECTED_BADGE, SELECTED_BADGE } from "@/lib/status-badge";
import { cn } from "@/lib/utils";

export type InterviewRow = Interview & {
  past: boolean;
  status: string;
  when: string;
};

export type InterviewFilter =
  | "all"
  | "upcoming"
  | "completed"
  | "Awaiting result"
  | "Cleared"
  | "Selected"
  | "Not selected";

const OUTCOMES = ["Awaiting result", "Cleared", "Selected", "Not selected"] as const;

const features = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
  filterFns: { includesString: filterFn_includesString },
});

const SEARCHABLE = new Set(["interview", "role", "interviewer"]);
const PAGE_SIZE = 10;

const MODE_ICONS: Record<InterviewMode, typeof Video> = {
  "Video call": Video,
  "In-person": MapPin,
  Phone: Phone,
};

const applicationHref = (i: Interview) =>
  `${CANDIDATE_HOME}/applications/${i.applicationId}`;

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));

const fmtShortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));

function statusBadge(row: InterviewRow) {
  if (!row.past) return "bg-brand/10 text-brand";
  if (row.status === "Selected") return SELECTED_BADGE;
  if (row.status === "Cleared") return "bg-good/12 text-good";
  if (row.status === "Not selected") return NOT_SELECTED_BADGE;
  return "bg-amber-500/12 text-amber-700 dark:text-amber-300";
}

function matches(row: InterviewRow, filter: InterviewFilter) {
  if (filter === "all") return true;
  if (filter === "upcoming") return !row.past;
  if (filter === "completed") return row.past;
  return row.status === filter;
}

const helper = createColumnHelper<typeof features, InterviewRow>();

const columns = helper.columns([
  helper.accessor((i) => `${i.company} ${i.round}`, {
    id: "interview",
    header: "Interview",
    sortFn: "text",
    cell: ({ row }) => {
      const i = row.original;
      return (
        <div className="flex min-w-0 items-center gap-3">
          <CompanyAvatar
            name={i.company}
            logoUrl={i.companyLogoUrl}
            className={cn("size-9", i.past && "opacity-70")}
          />
          <div className="min-w-0">
            <Link
              href={applicationHref(i)}
              className="block truncate font-head font-bold hover:text-brand focus-visible:underline focus-visible:outline-none"
            >
              {i.company}
              <span className="hidden font-medium text-muted-foreground sm:inline">
                {" "}
                · {i.round}
              </span>
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              <span className="hidden sm:inline">{i.role}</span>
              <span className="sm:hidden">{i.round}</span>
            </p>
            <p className="truncate text-xs text-muted-foreground sm:hidden">
              {fmtShortDate(i.startsAt)} · {formatInterviewTime(i.startsAt)}
            </p>
          </div>
        </div>
      );
    },
  }),
  helper.accessor("role", { header: "Role", sortFn: "text" }),
  helper.accessor("startsAt", {
    id: "date",
    header: "Date",
    sortFn: "alphanumeric",
    sortDescFirst: true,
    cell: ({ row }) => {
      const i = row.original;
      return (
        <div className="whitespace-nowrap">
          <p className="font-medium">{fmtDate(i.startsAt)}</p>
          <p className="text-xs text-muted-foreground">
            {formatInterviewTime(i.startsAt)} – {formatInterviewTime(i.endsAt)}
          </p>
        </div>
      );
    },
  }),
  helper.accessor("mode", {
    header: "Mode",
    enableSorting: false,
    cell: ({ getValue }) => {
      const Icon = MODE_ICONS[getValue()];
      return (
        <span className="flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
          <Icon className="size-3.5 flex-none" /> {getValue()}
        </span>
      );
    },
  }),
  helper.accessor("interviewer", {
    header: "Interviewer",
    sortFn: "text",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()}</span>
    ),
  }),
  helper.accessor("status", {
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => (
      <span
        className={cn(
          "rounded-full px-2 py-0.5 font-head text-[11px] font-bold whitespace-nowrap",
          statusBadge(row.original),
        )}
      >
        {row.original.past ? row.original.status : row.original.when}
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
  interview: "w-full max-w-0 pl-4 sm:w-auto sm:max-w-none sm:min-w-64 sm:pl-5",
  role: "hidden",
  date: "hidden sm:table-cell",
  mode: "hidden md:table-cell",
  interviewer: "hidden lg:table-cell",
  open: "w-10 pr-4 sm:pr-5",
};

export function InterviewsTable({
  interviews,
  initialFilter,
}: {
  interviews: InterviewRow[];
  initialFilter: InterviewFilter;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<InterviewFilter>(initialFilter);
  const filterOptions = useMemo(() => {
    const present = new Set(interviews.map((i) => i.status));
    return [
      { value: "all" as const, label: "All" },
      { value: "upcoming" as const, label: "Upcoming" },
      { value: "completed" as const, label: "Completed" },
      ...OUTCOMES.filter((o) => present.has(o)).map((o) => ({
        value: o,
        label: o,
      })),
    ];
  }, [interviews]);
  const data = useMemo(
    () => interviews.filter((i) => matches(i, filter)),
    [interviews, filter],
  );

  const table = useTable({
    features,
    columns,
    data,
    getRowId: (i) => i.id,
    globalFilterFn: "includesString",
    getColumnCanGlobalFilter: (column) => SEARCHABLE.has(column.id),
    initialState: {
      sorting: [{ id: "date", desc: initialFilter !== "upcoming" }],
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
    <section aria-label="Your interviews" className="space-y-4">
      <TableToolbar>
        <TableSearch
          value={query}
          onChange={(v) => table.setGlobalFilter(v)}
          placeholder="Search company, role or interviewer"
          label="Search interviews"
        />
        <FilterSelect
          label="Status"
          options={filterOptions}
          value={filter}
          onChange={(v) => {
            setFilter(v);
            table.setSorting([{ id: "date", desc: v !== "upcoming" }]);
            table.setPageIndex(0);
          }}
        />
      </TableToolbar>

      {rows.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={query ? "No matching interviews" : "Nothing here yet"}
          action={
            query ? (
              <Button
                variant="outline"
                className="font-head"
                onClick={() => table.setGlobalFilter("")}
              >
                Clear search
              </Button>
            ) : filter !== "all" ? (
              <Button
                variant="outline"
                className="font-head"
                onClick={() => setFilter("all")}
              >
                Show all interviews
              </Button>
            ) : null
          }
        >
          {query
            ? "Try a different company, role or interviewer."
            : "Interviews employers schedule with you will show up here."}
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
                    router.push(applicationHref(row.original));
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

type InterviewColumn = Column<typeof features, InterviewRow, unknown>;

function ariaSort(column: InterviewColumn) {
  const sorted = column.getIsSorted();
  if (!column.getCanSort()) return undefined;
  return sorted === "asc"
    ? "ascending"
    : sorted === "desc"
      ? "descending"
      : "none";
}

function SortIcon({ column }: { column: InterviewColumn }) {
  const sorted = column.getIsSorted();
  if (sorted === "asc") return <ArrowUp className="size-3.5 text-foreground" />;
  if (sorted === "desc")
    return <ArrowDown className="size-3.5 text-foreground" />;
  return <ArrowUpDown className="size-3.5 opacity-50" />;
}
