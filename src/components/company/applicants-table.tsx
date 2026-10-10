"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Search,
  UserRoundSearch,
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
import { COMPANY_HOME } from "@/components/company/nav";
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
  STAGES,
  formatExperienceMonths,
  type Applicant,
} from "@/lib/company-activity";
import { cn } from "@/lib/utils";

export const applicantHref = (ref: string) =>
  `${COMPANY_HOME}/applicants/${ref}`;

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

type Row = Applicant & { jobTitle: string };

const SEARCHABLE = new Set(["applicant", "job", "skills"]);
const PAGE_SIZE = 10;
const MAX_SKILLS = 2;

const TABS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "rejected", label: "Not selected" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function inTab(a: Applicant, tab: TabKey) {
  if (tab === "new") return a.status === "active" && a.stage === 0;
  if (tab === "shortlisted") return a.status === "active" && a.stage >= 2;
  if (tab === "rejected") return a.status === "rejected";
  return true;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts[parts.length - 1][0] : ""}`;
}

const helper = createColumnHelper<typeof features, Row>();

const columns = helper.columns([
  helper.accessor((a) => `${a.name ?? ""} ${a.ref} ${a.city}`, {
    id: "applicant",
    header: "Applicant",
    enableSorting: false,
    cell: ({ row }) => {
      const a = row.original;
      const rejected = a.status === "rejected";
      return (
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-9 flex-none items-center justify-center rounded-full font-head text-xs font-extrabold",
              a.name
                ? "bg-brand/10 text-brand"
                : "bg-muted text-muted-foreground",
              rejected && "opacity-60",
            )}
          >
            {a.name ? initials(a.name) : <EyeOff className="size-4" />}
          </span>
          <div className="min-w-0">
            <Link
              href={applicantHref(a.ref)}
              className={cn(
                "block truncate font-head font-bold hover:text-brand focus-visible:underline focus-visible:outline-none",
                rejected && "text-muted-foreground",
              )}
            >
              {a.name ?? "Name hidden"}
            </Link>
            <p className="truncate text-xs whitespace-nowrap text-muted-foreground">
              <span className="font-mono">{a.ref}</span> · {a.city}
            </p>
          </div>
        </div>
      );
    },
  }),
  helper.accessor("jobTitle", {
    id: "job",
    header: "Applied for",
    sortFn: "text",
    cell: ({ getValue }) => (
      <span className="block max-w-48 truncate text-muted-foreground">
        {getValue()}
      </span>
    ),
  }),
  helper.accessor("experienceMonths", {
    id: "experience",
    header: "Experience",
    sortFn: "basic",
    sortDescFirst: true,
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {formatExperienceMonths(getValue())}
      </span>
    ),
  }),
  helper.accessor((a) => a.skills.join(", "), {
    id: "skills",
    header: "Top skills",
    enableSorting: false,
    cell: ({ row }) => {
      const { skills } = row.original;
      if (skills.length === 0)
        return <span className="text-muted-foreground">—</span>;
      return (
        <div
          title={skills.join(", ")}
          className="flex max-w-72 items-center gap-1"
        >
          {skills.slice(0, MAX_SKILLS).map((s) => (
            <span
              key={s}
              className="min-w-0 truncate rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {s}
            </span>
          ))}
          {skills.length > MAX_SKILLS && (
            <span className="flex-none text-xs text-muted-foreground">
              +{skills.length - MAX_SKILLS}
            </span>
          )}
        </div>
      );
    },
  }),
  helper.accessor((a) => (a.status === "active" ? a.stage : -1), {
    id: "stage",
    header: "Stage",
    sortFn: "basic",
    sortDescFirst: true,
    cell: ({ row }) => {
      const a = row.original;
      const rejected = a.status === "rejected";
      return (
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-head text-[11px] font-bold whitespace-nowrap",
              rejected
                ? "bg-muted text-muted-foreground"
                : a.stage >= 2
                  ? "bg-good/12 text-good"
                  : "bg-brand/10 text-brand",
            )}
          >
            {rejected
              ? "Not selected"
              : a.stage === 0
                ? "New"
                : STAGES[a.stage]}
          </span>
        </div>
      );
    },
  }),
  helper.accessor("appliedOn", {
    header: "Applied",
    sortFn: "alphanumeric",
    sortDescFirst: true,
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {formatShortDate(getValue())}
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
  applicant: "min-w-52 pl-4 sm:pl-5",
  job: "hidden lg:table-cell",
  experience: "hidden md:table-cell",
  skills: "hidden xl:table-cell",
  appliedOn: "hidden sm:table-cell",
  open: "w-10 pr-4 sm:pr-5",
};

export function ApplicantsTable({
  applicants,
  jobTitles,
}: {
  applicants: Applicant[];
  jobTitles?: Record<string, string>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("all");
  const rows = useMemo(
    () =>
      applicants.map((a) => ({ ...a, jobTitle: jobTitles?.[a.jobId] ?? "" })),
    [applicants, jobTitles],
  );
  const data = useMemo(() => rows.filter((a) => inTab(a, tab)), [rows, tab]);
  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((t) => [
          t.key,
          applicants.filter((a) => inTab(a, t.key)).length,
        ]),
      ) as Record<TabKey, number>,
    [applicants],
  );

  const table = useTable({
    features,
    columns,
    data,
    getRowId: (a) => a.ref,
    globalFilterFn: "includesString",
    getColumnCanGlobalFilter: (column) => SEARCHABLE.has(column.id),
    initialState: {
      sorting: [{ id: "appliedOn", desc: true }],
      pagination: { pageIndex: 0, pageSize: PAGE_SIZE },
    },
  });

  const query = String(table.state.globalFilter ?? "");
  const pageRows = table.getRowModel().rows;
  const total = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.state.pagination;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);
  const shown = (id: string) => id !== "job" || !!jobTitles;

  return (
    <section aria-label="Applicants" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filter applicants"
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
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] font-bold tabular-nums",
                    selected ? "bg-white/20" : "bg-muted",
                  )}
                >
                  {counts[t.key]}
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
            placeholder={
              jobTitles
                ? "Search name, ref, job or skill"
                : "Search name, ref or skill"
            }
            aria-label="Search applicants"
            className="h-10 w-full rounded-full border border-border bg-card pr-4 pl-10 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-3 focus:ring-brand/15"
          />
        </div>
      </div>

      {pageRows.length === 0 ? (
        <EmptyState
          icon={UserRoundSearch}
          title={query ? "No matching applicants" : "No applicants here"}
          action={
            query ? (
              <Button
                variant="outline"
                className="font-head"
                onClick={() => table.setGlobalFilter("")}
              >
                Clear search
              </Button>
            ) : undefined
          }
        >
          {query
            ? "Try a different name, reference or skill."
            : "Applicants at this stage will show up here."}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="hover:bg-transparent">
                  {group.headers
                    .filter((header) => shown(header.column.id))
                    .map((header) => (
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
                            className="-ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 whitespace-nowrap transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
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
              {pageRows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("a, button")) return;
                    router.push(applicantHref(row.id));
                  }}
                  className="group/row cursor-pointer"
                >
                  {row
                    .getAllCells()
                    .filter((cell) => shown(cell.column.id))
                    .map((cell) => (
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

          {total > PAGE_SIZE && (
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
          )}
        </div>
      )}
    </section>
  );
}

type ApplicantColumn = Column<typeof features, Row, unknown>;

function ariaSort(column: ApplicantColumn) {
  const sorted = column.getIsSorted();
  if (!column.getCanSort()) return undefined;
  return sorted === "asc"
    ? "ascending"
    : sorted === "desc"
      ? "descending"
      : "none";
}

function SortIcon({ column }: { column: ApplicantColumn }) {
  const sorted = column.getIsSorted();
  if (sorted === "asc") return <ArrowUp className="size-3.5 text-foreground" />;
  if (sorted === "desc")
    return <ArrowDown className="size-3.5 text-foreground" />;
  return <ArrowUpDown className="size-3.5 opacity-50" />;
}

export function IdentityNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-2xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground",
        className,
      )}
    >
      <EyeOff className="mt-0.5 size-3.5 flex-none" />
      You assess applicants on skills and experience first. Names appear once
      you shortlist someone; phone numbers and emails are never shared, and
      JobClubb coordinates every interview.
    </p>
  );
}
