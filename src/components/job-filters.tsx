"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Lock, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  SORTS,
  jobsHref,
  type FacetCounts,
  type JobQuery,
  type JobSort,
} from "@/lib/jobs-search";
import { JOB_TYPES, INDUSTRIES, WORK_MODES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

type ListKey = "sectors" | "jobTypes" | "workModes";
type Size = "sm" | "lg";

const GROUPS: {
  key: ListKey;
  title: string;
  options: readonly string[];
  layout: "list" | "grid-2" | "grid-3";
}[] = [
  {
    key: "sectors",
    title: "Sector",
    options: INDUSTRIES.map((v) => v.name),
    layout: "list",
  },
  { key: "jobTypes", title: "Job type", options: JOB_TYPES, layout: "grid-2" },
  {
    key: "workModes",
    title: "Work mode",
    options: WORK_MODES,
    layout: "grid-3",
  },
];

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function countActive(query: JobQuery) {
  return query.sectors.length + query.jobTypes.length + query.workModes.length;
}

function clearFilters(query: JobQuery): JobQuery {
  return { ...query, sectors: [], jobTypes: [], workModes: [] };
}

function useNavigate(query: JobQuery) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(query);
  const navigate = (next: JobQuery) =>
    startTransition(() => {
      setCurrent(next);
      router.push(jobsHref(next), { scroll: false });
    });
  return { current, navigate, pending };
}

/* ---------- Desktop sidebar ---------- */

export function JobFiltersPanel({
  query,
  member,
  counts,
}: {
  query: JobQuery;
  member: boolean;
  counts?: FacetCounts;
}) {
  const { current, navigate, pending } = useNavigate(query);
  const active = countActive(current);

  return (
    <div
      aria-busy={pending}
      className="rounded-2xl border border-border bg-card"
    >
      <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-5">
        <div className="flex items-center gap-2 font-head font-bold tracking-tight">
          <SlidersHorizontal className="size-4 text-brand" />
          Filters
          {active > 0 && <CountBadge value={active} />}
        </div>
        {active > 0 && (
          <button
            type="button"
            onClick={() => navigate(clearFilters(current))}
            className="font-head text-xs font-bold text-brand hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {!member && (
        <div className="px-5 pt-4">
          <MembersOnlyNote />
        </div>
      )}

      <fieldset disabled={!member} className="divide-y divide-border">
        {GROUPS.map((group) => (
          <FilterGroup
            key={group.key}
            group={group}
            prefix="filter"
            selected={current[group.key]}
            counts={counts?.[group.key]}
            className="px-5 py-4"
            onToggle={(v) =>
              navigate({
                ...current,
                [group.key]: toggle(current[group.key], v),
              })
            }
            onClear={() => navigate({ ...current, [group.key]: [] })}
          />
        ))}
      </fieldset>
    </div>
  );
}

/* ---------- Small screens: toolbar + bottom sheet ---------- */

export function JobFiltersSheet({
  query,
  member,
  counts,
}: {
  query: JobQuery;
  member: boolean;
  counts?: FacetCounts;
}) {
  const { navigate } = useNavigate(query);
  const [draft, setDraft] = useState(query);
  const [open, setOpen] = useState(false);
  const active = countActive(query);
  const draftActive = countActive(draft);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(query);
        setOpen(next);
      }}
    >
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="font-head font-semibold lg:hidden"
          >
            <SlidersHorizontal className="text-brand" />
            <span className={cn(member && "sr-only sm:not-sr-only")}>
              Filters
            </span>
            {active > 0 && <CountBadge value={active} />}
          </Button>
        }
      />

      <SheetContent
        side="bottom"
        className="max-h-[85dvh] gap-0 rounded-t-3xl p-0 pb-[env(safe-area-inset-bottom)]"
      >
        <div
          aria-hidden
          className="mx-auto mt-2.5 h-1.5 w-10 flex-none rounded-full bg-border"
        />

        <div className="flex-none border-b border-border px-5 pt-3 pb-4">
          <SheetTitle className="font-head text-lg font-bold tracking-tight">
            Filters
          </SheetTitle>
          <SheetDescription className="text-xs">
            {draftActive > 0
              ? `${draftActive} selected`
              : "Narrow openings by sector, type and mode"}
          </SheetDescription>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5">
          {!member && (
            <div className="pt-4">
              <MembersOnlyNote onNavigate={() => setOpen(false)} />
            </div>
          )}
          <fieldset disabled={!member} className="divide-y divide-border">
            {GROUPS.map((group) => (
              <FilterGroup
                key={group.key}
                group={group}
                prefix="m-filter"
                size="lg"
                selected={draft[group.key]}
                counts={counts?.[group.key]}
                className="py-5"
                onToggle={(v) =>
                  setDraft((d) => ({
                    ...d,
                    [group.key]: toggle(d[group.key], v),
                  }))
                }
                onClear={() => setDraft((d) => ({ ...d, [group.key]: [] }))}
              />
            ))}
          </fieldset>
        </div>

        <div className="flex flex-none gap-3 border-t border-border bg-popover px-5 py-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 font-head"
            disabled={draftActive === 0}
            onClick={() => setDraft(clearFilters)}
          >
            Clear all
          </Button>
          <SheetClose
            render={
              <Button
                size="lg"
                className="flex-2 bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                disabled={!member}
                onClick={() => navigate(draft)}
              >
                Apply filters
              </Button>
            }
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ---------- Toolbar pieces ---------- */

export function JobSortSelect({ query }: { query: JobQuery }) {
  const { navigate } = useNavigate(query);

  return (
    <Select
      items={SORTS}
      value={query.sort}
      onValueChange={(sort) => navigate({ ...query, sort: sort as JobSort })}
    >
      <SelectTrigger
        size="sm"
        aria-label="Sort openings"
        className="w-36 font-head font-medium sm:w-45"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(SORTS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ActiveFilters({ query }: { query: JobQuery }) {
  const { navigate } = useNavigate(query);

  const chips = GROUPS.flatMap((group) =>
    query[group.key].map((v) => ({
      label: v,
      remove: { ...query, [group.key]: toggle(query[group.key], v) },
    })),
  );

  if (chips.length === 0) return null;

  return (
    <ul className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0 [&::-webkit-scrollbar]:hidden">
      {chips.map(({ label, remove }) => (
        <li key={label} className="flex-none">
          <button
            type="button"
            aria-label={`Remove ${label} filter`}
            onClick={() => navigate(remove)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 pr-2 pl-3 text-xs font-medium text-foreground transition-colors hover:border-brand"
          >
            {label}
            <X className="size-3.5 text-brand" />
          </button>
        </li>
      ))}
      <li className="flex-none">
        <button
          type="button"
          onClick={() => navigate(clearFilters(query))}
          className="inline-flex h-8 items-center px-2 font-head text-xs font-bold text-brand hover:underline"
        >
          Clear all
        </button>
      </li>
    </ul>
  );
}

/* ---------- Shared pieces ---------- */

function CountBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] pt-0.5 font-bold text-brand-foreground">
      {value}
    </span>
  );
}

function MembersOnlyNote({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-brand/5 p-3.5 ring-1 ring-brand/20">
      <span className="flex size-7 flex-none items-center justify-center rounded-lg bg-brand/10">
        <Lock className="size-3.5 text-brand" />
      </span>
      <div className="min-w-0">
        <p className="font-head text-sm font-bold tracking-tight">
          Members-only filters
        </p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          Filtering reveals company, sector and salary details.{" "}
          <Link
            href="/membership"
            onClick={onNavigate}
            className="font-head font-bold text-brand hover:underline"
          >
            See plans
          </Link>
        </p>
      </div>
    </div>
  );
}

function FilterGroup({
  group,
  prefix,
  selected,
  counts,
  onToggle,
  onClear,
  size = "sm",
  className,
}: {
  group: (typeof GROUPS)[number];
  prefix: string;
  selected: string[];
  counts?: Record<string, number>;
  onToggle: (value: string) => void;
  onClear: () => void;
  size?: Size;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex h-5 items-center justify-between gap-2">
        <h3 className="font-head text-sm font-bold tracking-tight">
          {group.title}
          {selected.length > 0 && (
            <span className="ml-1.5 font-semibold text-brand">
              {selected.length}
            </span>
          )}
        </h3>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Reset
          </button>
        )}
      </div>
      <ul
        className={cn(
          "mt-3",
          group.layout === "list" && (size === "lg" ? "-mx-3" : "-mx-2"),
          group.layout === "grid-2" && "grid grid-cols-2 gap-2",
          group.layout === "grid-3" && "grid grid-cols-3 gap-2",
        )}
      >
        {group.options.map((label) => (
          <li key={label}>
            <Option
              id={`${prefix}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              label={label}
              count={counts?.[label]}
              checked={selected.includes(label)}
              onToggle={() => onToggle(label)}
              variant={group.layout === "list" ? "row" : "chip"}
              size={size}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Option({
  id,
  label,
  count,
  checked,
  onToggle,
  variant,
  size,
}: {
  id: string;
  label: string;
  count?: number;
  checked: boolean;
  onToggle: () => void;
  variant: "row" | "chip";
  size: Size;
}) {
  const empty = count === 0 && !checked;

  return (
    <>
      <input
        type="checkbox"
        id={id}
        className="peer sr-only"
        checked={checked}
        onChange={onToggle}
      />
      {variant === "row" ? (
        <label
          htmlFor={id}
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-lg transition-colors select-none hover:bg-muted peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-disabled:cursor-not-allowed peer-disabled:opacity-60 peer-disabled:hover:bg-transparent",
            size === "lg" ? "h-11 px-3 text-[15px]" : "h-9 px-2 text-sm",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "flex size-4 flex-none items-center justify-center rounded-[5px] border transition-colors",
              checked
                ? "border-brand bg-brand text-brand-foreground"
                : "border-input bg-background",
            )}
          >
            {checked && <Check className="size-3" strokeWidth={3} />}
          </span>
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              checked
                ? "font-medium text-foreground"
                : empty
                  ? "text-muted-foreground/70"
                  : "text-foreground/80",
            )}
          >
            {label}
          </span>
          {count !== undefined && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {count}
            </span>
          )}
        </label>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            "flex w-full cursor-pointer items-center justify-center rounded-lg border font-medium transition-colors select-none peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
            size === "lg" ? "h-10 text-sm" : "h-8 text-xs",
            checked
              ? "border-brand bg-brand/10 text-brand"
              : cn(
                  "border-border bg-background hover:border-brand/50 hover:text-foreground peer-disabled:hover:border-border",
                  empty ? "text-muted-foreground/70" : "text-muted-foreground",
                ),
          )}
        >
          {label}
        </label>
      )}
    </>
  );
}
