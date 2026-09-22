"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { JOB_TYPES, VERTICALS, WORK_MODES } from "@/lib/taxonomy";

type Filters = {
  sectors: string[];
  jobTypes: string[];
  workModes: string[];
};

const EMPTY: Filters = { sectors: [], jobTypes: [], workModes: [] };

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function countActive(filters: Filters) {
  return (
    filters.sectors.length + filters.jobTypes.length + filters.workModes.length
  );
}

function filterId(prefix: string, label: string) {
  return `${prefix}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

/* ---------- Desktop sidebar ---------- */

export function JobFiltersPanel() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const active = countActive(filters);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-head font-bold tracking-tight">
          <SlidersHorizontal className="size-4 text-brand" />
          Filters
        </div>
        {active > 0 && (
          <button
            type="button"
            onClick={() => setFilters(EMPTY)}
            className="font-head text-xs font-bold text-brand hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mt-4 -mx-5 divide-y divide-border">
        <FilterGroup title="Sector">
          <ul className="mt-3 grid gap-y-2.5">
            {VERTICALS.map((v) => {
              const id = filterId("filter", v.name);
              return (
                <li key={v.slug} className="flex min-w-0 items-center gap-2.5">
                  <Checkbox
                    id={id}
                    checked={filters.sectors.includes(v.name)}
                    onCheckedChange={() =>
                      setFilters((f) => ({
                        ...f,
                        sectors: toggle(f.sectors, v.name),
                      }))
                    }
                  />
                  <Label
                    htmlFor={id}
                    className="cursor-pointer truncate text-sm font-normal text-muted-foreground hover:text-foreground"
                  >
                    {v.name}
                  </Label>
                </li>
              );
            })}
          </ul>
        </FilterGroup>

        <FilterGroup title="Job type">
          <ChipList
            prefix="filter"
            options={JOB_TYPES}
            selected={filters.jobTypes}
            onToggle={(t) =>
              setFilters((f) => ({ ...f, jobTypes: toggle(f.jobTypes, t) }))
            }
          />
        </FilterGroup>

        <FilterGroup title="Work mode">
          <ChipList
            prefix="filter"
            options={WORK_MODES}
            selected={filters.workModes}
            onToggle={(m) =>
              setFilters((f) => ({ ...f, workModes: toggle(f.workModes, m) }))
            }
          />
        </FilterGroup>
      </div>
    </div>
  );
}

/* ---------- Small screens: toolbar + bottom sheet ---------- */

export function JobFiltersSheet({ member }: { member: boolean }) {
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [open, setOpen] = useState(false);
  const active = countActive(applied);
  const draftActive = countActive(draft);

  const appliedChips = [
    ...applied.sectors.map((v) => ({ key: "sectors" as const, v })),
    ...applied.jobTypes.map((v) => ({ key: "jobTypes" as const, v })),
    ...applied.workModes.map((v) => ({ key: "workModes" as const, v })),
  ];

  return (
    <div className="lg:hidden">
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (next) setDraft(applied);
          setOpen(next);
        }}
      >
        <SheetTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="font-head font-semibold"
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

          <div className="flex flex-none items-center justify-between gap-3 border-b border-border px-5 pt-3 pb-4">
            <div className="min-w-0">
              <SheetTitle className="font-head text-lg font-bold tracking-tight">
                Filters
              </SheetTitle>
              <SheetDescription className="text-xs">
                {draftActive > 0
                  ? `${draftActive} selected`
                  : "Narrow openings by sector, type and mode"}
              </SheetDescription>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-2">
            <SheetGroup title="Sector">
              <ChipList
                prefix="m-filter"
                size="lg"
                options={VERTICALS.map((v) => v.name)}
                selected={draft.sectors}
                onToggle={(s) =>
                  setDraft((f) => ({ ...f, sectors: toggle(f.sectors, s) }))
                }
              />
            </SheetGroup>
            <SheetGroup title="Job type">
              <ChipList
                prefix="m-filter"
                size="lg"
                options={JOB_TYPES}
                selected={draft.jobTypes}
                onToggle={(t) =>
                  setDraft((f) => ({ ...f, jobTypes: toggle(f.jobTypes, t) }))
                }
              />
            </SheetGroup>
            <SheetGroup title="Work mode">
              <ChipList
                prefix="m-filter"
                size="lg"
                options={WORK_MODES}
                selected={draft.workModes}
                onToggle={(m) =>
                  setDraft((f) => ({
                    ...f,
                    workModes: toggle(f.workModes, m),
                  }))
                }
              />
            </SheetGroup>

            {!member && (
              <div className="mt-2 mb-3 flex items-center gap-3 rounded-2xl border border-border bg-muted/50 p-3.5">
                <span className="flex size-8 flex-none items-center justify-center rounded-lg bg-brand/10">
                  <Lock className="size-3.5 text-brand" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-head text-sm font-bold">Location match</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Jobs near your home address — members only.
                  </p>
                </div>
                <SheetClose
                  nativeButton={false}
                  render={
                    <Link
                      href="/membership"
                      className="flex-none font-head text-xs font-bold text-brand hover:underline"
                    >
                      Unlock
                    </Link>
                  }
                />
              </div>
            )}
          </div>

          <div className="flex flex-none gap-3 border-t border-border bg-popover px-5 py-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 font-head"
              disabled={draftActive === 0}
              onClick={() => setDraft(EMPTY)}
            >
              Clear all
            </Button>
            <SheetClose
              render={
                <Button
                  size="lg"
                  className="flex-2 bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                  onClick={() => setApplied(draft)}
                >
                  Apply filters
                </Button>
              }
            />
          </div>
        </SheetContent>
      </Sheet>

      {appliedChips.length > 0 && (
        <ul className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
          {appliedChips.map(({ key, v }) => (
            <li key={`${key}-${v}`} className="flex-none">
              <button
                type="button"
                aria-label={`Remove ${v} filter`}
                onClick={() =>
                  setApplied((f) => ({ ...f, [key]: toggle(f[key], v) }))
                }
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 pr-2 pl-3 text-xs font-medium text-foreground"
              >
                {v}
                <X className="size-3.5 text-brand" />
              </button>
            </li>
          ))}
          <li className="flex-none">
            <button
              type="button"
              onClick={() => setApplied(EMPTY)}
              className="inline-flex h-8 items-center px-2 font-head text-xs font-bold text-brand"
            >
              Clear all
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

/* ---------- Shared pieces ---------- */

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4 px-4 first:pt-0 last:pb-0">
      <h3 className="font-head text-sm font-bold tracking-tight">{title}</h3>
      {children}
    </div>
  );
}

function SheetGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-b border-border py-4 last:border-b-0">
      <legend className="float-left w-full font-head text-sm font-bold tracking-tight">
        {title}
      </legend>
      {children}
    </fieldset>
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
    <ul className="clear-both flex flex-wrap gap-2 pt-3">
      {options.map((label) => {
        const id = filterId(prefix, label);
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
              className={
                "inline-flex cursor-pointer items-center rounded-full border border-border bg-background text-muted-foreground transition-colors select-none hover:border-brand/50 hover:text-foreground peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 " +
                (size === "lg" ? "h-10 px-4 text-sm" : "px-3 py-1.5 text-xs")
              }
            >
              {label}
            </label>
          </li>
        );
      })}
    </ul>
  );
}
