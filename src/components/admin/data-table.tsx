"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Search,
} from "lucide-react";
import {
  columnFilteringFeature,
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
  type ColumnDef,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { INDUSTRIES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

export const adminTableFeatures = tableFeatures({
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

type Features = typeof adminTableFeatures;

export function DataTable<T extends object>({
  data,
  columns,
  getRowId,
  searchable,
  searchPlaceholder,
  toolbar,
  initialSort,
  columnClass = {},
  onRowClick,
  emptyTitle = "Nothing here yet",
  pageSize = 10,
}: {
  data: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<Features, T, any>[];
  getRowId: (row: T) => string;
  searchable: string[];
  searchPlaceholder: string;
  toolbar?: React.ReactNode;
  initialSort?: { id: string; desc: boolean };
  columnClass?: Record<string, string>;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  pageSize?: number;
}) {
  const table = useTable({
    features: adminTableFeatures,
    columns,
    data,
    getRowId,
    globalFilterFn: "includesString",
    getColumnCanGlobalFilter: (column) => searchable.includes(column.id),
    initialState: {
      sorting: initialSort ? [initialSort] : [],
      pagination: { pageIndex: 0, pageSize },
    },
  });

  const query = String(table.state.globalFilter ?? "");
  const rows = table.getRowModel().rows;
  const total = table.getFilteredRowModel().rows.length;
  const { pageIndex } = table.state.pagination;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">{toolbar}</div>
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-10 w-full rounded-full border border-border bg-card pr-4 pl-10 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-3 focus:ring-brand/15"
          />
        </div>
      </div>

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
                      "h-11 px-3 text-xs font-semibold text-muted-foreground first:pl-4 last:pr-4 sm:first:pl-5 sm:last:pr-5",
                      columnClass[header.column.id],
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
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="py-16 text-center"
                >
                  <Building2 className="mx-auto size-8 text-muted-foreground/60" />
                  <p className="mt-3 font-head font-medium text-xs text-muted-foreground">
                    {query ? "No matches" : emptyTitle}
                  </p>
                  {query && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 font-head"
                      onClick={() => table.setGlobalFilter("")}
                    >
                      Clear search
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={
                    onRowClick
                      ? (e) => {
                          if (
                            (e.target as HTMLElement).closest(
                              "a, button, [role=menu]",
                            )
                          )
                            return;
                          onRowClick(row.original);
                        }
                      : undefined
                  }
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "px-3 py-3 first:pl-4 last:pr-4 sm:first:pl-5 sm:last:pr-5",
                        columnClass[cell.column.id],
                      )}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
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
    </div>
  );
}

type SortableColumn = Pick<
  Column<Features, object>,
  "getIsSorted" | "getCanSort"
>;

function ariaSort(column: SortableColumn) {
  const sorted = column.getIsSorted();
  if (!column.getCanSort()) return undefined;
  return sorted === "asc"
    ? "ascending"
    : sorted === "desc"
      ? "descending"
      : "none";
}

function SortIcon({ column }: { column: SortableColumn }) {
  const sorted = column.getIsSorted();
  if (sorted === "asc") return <ArrowUp className="size-3.5 text-foreground" />;
  if (sorted === "desc")
    return <ArrowDown className="size-3.5 text-foreground" />;
  return <ArrowUpDown className="size-3.5 opacity-50" />;
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export const industryName = (slug: string) =>
  INDUSTRIES.find((v) => v.slug === slug)?.name ?? slug;
