"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, SlidersHorizontal, X } from "lucide-react";

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
import { SORTS, jobsHref, type JobQuery, type JobSort } from "@/lib/jobs-search";
import { JOB_TYPES, VERTICALS, WORK_MODES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

type ListKey = "sectors" | "jobTypes" | "workModes";

const GROUPS: { key: ListKey; title: string; options: readonly string[] }[] = [
  { key: "sectors", title: "Sector", options: VERTICALS.map((v) => v.name) },
  { key: "jobTypes", title: "Job type", options: JOB_TYPES },
  { key: "workModes", title: "Work mode", options: WORK_MODES },
];

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function countActive(query: JobQuery) {
  return (
    query.sectors.length + query.jobTypes.length + query.workModes.length
  );
}

function clearFilters(query: JobQuery): JobQuery {
  return { ...query, sectors: [], jobTypes: [], workModes: [] };
}

function useNavigate() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = (next: JobQuery) =>
    startTransition(() => router.push(jobsHref(next), { scroll: false }));
  return { navigate, pending };
}

/* ---------- Desktop sidebar ---------- */

export function JobFiltersPanel({
  query,
  member,
}: {
  query: JobQuery;
  member: boolean;
}) {
  const { navigate, pending } = useNavigate();
  const active = countActive(query);

  return (
    <div
      aria-busy={pending}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-head font-bold tracking-tight">
          <SlidersHorizontal className="size-4 text-brand" />
          Filters
        </div>
        {active > 0 && (
          <button
            type="button"
            onClick={() => navigate(clearFilters(query))}
            className="font-head text-xs font-bold text-brand hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {!member && <MembersOnlyNote />}

      <fieldset
        disabled={!member}
        className={cn(
          "mt-4 -mx-5 divide-y divide-border transition-opacity",
          (!member || pending) && "opacity-60",
        )}
      >
        {GROUPS.map((group) => (
          <div key={group.key} className="px-5 py-4 last:pb-0">
            <h3 className="font-head text-sm font-bold tracking-tight">
              {group.title}
            </h3>
            <ChipList
              prefix="filter"
              options={group.options}
              selected={query[group.key]}
              onToggle={(v) =>
                navigate({ ...query, [group.key]: toggle(query[group.key], v) })
              }
            />
          </div>
        ))}
      </fieldset>
    </div>
  );
}

/* ---------- Small screens: toolbar + bottom sheet ---------- */

export function JobFiltersSheet({
  query,
  member,
}: {
  query: JobQuery;
  member: boolean;
}) {
  const { navigate } = useNavigate();
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
            Filters
            {active > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-brand-foreground">
                {active}
              </span>
            )}
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

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-2">
          {!member && <MembersOnlyNote onNavigate={() => setOpen(false)} />}
          <fieldset disabled={!member} className={cn(!member && "opacity-60")}>
            {GROUPS.map((group) => (
              <div
                key={group.key}
                className="border-b border-border py-4 last:border-b-0"
              >
                <h3 className="font-head text-sm font-bold tracking-tight">
                  {group.title}
                </h3>
                <ChipList
                  prefix="m-filter"
                  size="lg"
                  options={group.options}
                  selected={draft[group.key]}
                  onToggle={(v) =>
                    setDraft((d) => ({ ...d, [group.key]: toggle(d[group.key], v) }))
                  }
                />
              </div>
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
  const { navigate } = useNavigate();

  return (
    <Select
      items={SORTS}
      value={query.sort}
      onValueChange={(sort) => navigate({ ...query, sort: sort as JobSort })}
    >
      <SelectTrigger
        size="sm"
        aria-label="Sort openings"
        className="w-40 font-head font-medium sm:w-45"
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
  const { navigate } = useNavigate();

  const chips: { label: string; remove: JobQuery }[] = [
    ...(query.q ? [{ label: `“${query.q}”`, remove: { ...query, q: "" } }] : []),
    ...(query.loc
      ? [{ label: `Near ${query.loc}`, remove: { ...query, loc: "" } }]
      : []),
    ...GROUPS.flatMap((group) =>
      query[group.key].map((v) => ({
        label: v,
        remove: { ...query, [group.key]: toggle(query[group.key], v) },
      })),
    ),
  ];

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
          onClick={() =>
            navigate({ ...clearFilters(query), q: "", loc: "" })
          }
          className="inline-flex h-8 items-center px-2 font-head text-xs font-bold text-brand hover:underline"
        >
          Clear all
        </button>
      </li>
    </ul>
  );
}

/* ---------- Shared pieces ---------- */

function MembersOnlyNote({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="mt-4 mb-1 flex items-start gap-3 rounded-xl border border-dashed border-brand/40 bg-brand/5 p-3">
      <Lock className="mt-0.5 size-3.5 flex-none text-brand" />
      <p className="text-xs leading-5 text-muted-foreground">
        Filters reveal company, sector and salary details, so they open up with
        membership.{" "}
        <Link
          href="/membership"
          onClick={onNavigate}
          className="font-head font-bold text-brand hover:underline"
        >
          See plans
        </Link>
      </p>
    </div>
  );
}

function ChipList({
  prefix,
  options,
  selected,
  onToggle,
  size = "sm",
}: {
  prefix: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  size?: "sm" | "lg";
}) {
  return (
    <ul className="flex flex-wrap gap-2 pt-3">
      {options.map((label) => {
        const id = `${prefix}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        return (
          <li key={label}>
            <input
              type="checkbox"
              id={id}
              className="peer sr-only"
              checked={selected.includes(label)}
              onChange={() => onToggle(label)}
            />
            <label
              htmlFor={id}
              className={cn(
                "inline-flex cursor-pointer items-center rounded-full border border-border bg-background text-muted-foreground transition-colors select-none hover:border-brand/50 hover:text-foreground peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-disabled:cursor-not-allowed peer-disabled:hover:border-border peer-disabled:hover:text-muted-foreground",
                size === "lg" ? "h-10 px-4 text-sm" : "px-3 py-1.5 text-xs",
              )}
            >
              {label}
            </label>
          </li>
        );
      })}
    </ul>
  );
}
