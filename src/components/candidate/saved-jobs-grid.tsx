"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BriefcaseBusiness,
  Check,
  Clock,
  Heart,
  IndianRupee,
  MapPin,
  Undo2,
} from "lucide-react";

import { Chip, EmptyState } from "@/components/candidate/dashboard-ui";
import { CompanyAvatar } from "@/components/company-avatar";
import { Button } from "@/components/ui/button";
import { formatShortDate, type SavedJob } from "@/lib/candidate-activity";
import { cn } from "@/lib/utils";

const SORTS = [
  { key: "recent", label: "Recently saved" },
  { key: "closing", label: "Closing soon" },
] as const;

type SortKey = (typeof SORTS)[number]["key"];

export function SavedJobsGrid({
  saved,
  appliedSlugs,
}: {
  saved: SavedJob[];
  appliedSlugs: string[];
}) {
  const [items, setItems] = useState(saved);
  const [removed, setRemoved] = useState<SavedJob | null>(null);
  const [sort, setSort] = useState<SortKey>("recent");
  const [sector, setSector] = useState<string | null>(null);

  const sectors = [...new Set(items.map((s) => s.job.industry))];
  const visible = items
    .filter((s) => !sector || s.job.industry === sector)
    .sort((a, b) =>
      sort === "closing"
        ? a.closesInDays - b.closesInDays
        : b.savedOn.localeCompare(a.savedOn),
    );

  function unsave(item: SavedJob) {
    setItems((list) => list.filter((s) => s.job.slug !== item.job.slug));
    setRemoved(item);
    if (sector && !items.some((s) => s !== item && s.job.industry === sector))
      setSector(null);
  }

  function undo() {
    if (!removed) return;
    setItems((list) => [...list, removed]);
    setRemoved(null);
  }

  return (
    <section aria-label="Saved jobs" className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <FilterPill active={!sector} onClick={() => setSector(null)}>
            All sectors
          </FilterPill>
          {sectors.map((s) => (
            <FilterPill
              key={s}
              active={sector === s}
              onClick={() => setSector(s)}
            >
              {s}
            </FilterPill>
          ))}
        </div>
        <label className="flex flex-none items-center gap-2 text-sm text-muted-foreground">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-9 rounded-lg border border-border bg-card px-2.5 font-head text-sm font-semibold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {removed && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm"
        >
          <p className="min-w-0 truncate">
            Removed{" "}
            <span className="font-semibold">{removed.job.designation}</span>{" "}
            from saved jobs.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="font-head text-brand"
            onClick={undo}
          >
            <Undo2 className="size-3.5" /> Undo
          </Button>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved jobs"
          action={
            <Button
              className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
              nativeButton={false}
              render={<Link href="/jobs" />}
            >
              Browse jobs
            </Button>
          }
        >
          Tap the heart on any job to keep it here for later.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((s) => (
            <SavedCard
              key={s.job.slug}
              item={s}
              applied={appliedSlugs.includes(s.job.slug)}
              onUnsave={() => unsave(s)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex-none rounded-full border px-3.5 py-1.5 font-head text-xs font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border bg-card text-muted-foreground hover:border-brand/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SavedCard({
  item: { job, savedOn, closesInDays },
  applied,
  onUnsave,
}: {
  item: SavedJob;
  applied: boolean;
  onUnsave: () => void;
}) {
  const urgent = closesInDays <= 5;

  return (
    <li className="group relative flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5">
      <div className="flex items-start gap-3">
        <CompanyAvatar name={job.company} logoUrl={job.companyLogoUrl} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/jobs/${job.slug}`}
            className="block truncate font-head font-bold tracking-tight after:absolute after:inset-0 after:rounded-2xl group-hover:text-brand"
          >
            {job.designation}
          </Link>
          <p className="truncate text-sm text-muted-foreground">
            {job.company}
          </p>
        </div>
        <button
          type="button"
          onClick={onUnsave}
          aria-label={`Remove ${job.designation} from saved jobs`}
          className="relative z-10 flex size-9 flex-none items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Heart className="size-4.5 fill-current" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
        <Chip icon={MapPin}>{job.location}</Chip>
        <Chip icon={IndianRupee}>{job.salaryRange.replace(/₹/g, "")}</Chip>
        <Chip icon={BriefcaseBusiness}>{job.experience}</Chip>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <div className="min-w-0 text-xs">
          <p
            className={cn(
              "flex items-center gap-1 font-head font-bold",
              urgent ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <Clock className="size-3.5" />
            {closesInDays === 1
              ? "Closes tomorrow"
              : `Closes in ${closesInDays} days`}
          </p>
        </div>
        {applied ? (
          <span className="relative z-10 inline-flex flex-none items-center gap-1 rounded-full bg-good/12 px-3 py-1.5 font-head text-xs font-bold text-good">
            <Check className="size-3.5" strokeWidth={3} /> Applied
          </span>
        ) : (
          <Button
            size="sm"
            className="relative z-10 flex-none bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href={`/jobs/${job.slug}`} />}
          >
            Apply now
          </Button>
        )}
      </div>
    </li>
  );
}
