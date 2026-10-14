"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Briefcase,
  CircleCheck,
  Clock,
  Heart,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/candidate/dashboard-ui";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { CompanyAvatar } from "@/components/company-avatar";
import { Salary } from "@/components/salary";
import { updateSavedJob } from "@/components/save-job-button";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatShortDate, type SavedJob } from "@/lib/candidate-activity";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "To apply" },
  { key: "applied", label: "Applied" },
  { key: "closed", label: "Closed" },
] as const;

const SORTS = {
  saved: "Recently saved",
  posted: "Newest posting",
} as const;

type FilterKey = (typeof FILTERS)[number]["key"];
type SortKey = keyof typeof SORTS;

export function SavedJobsGrid({
  saved,
  applied,
}: {
  saved: SavedJob[];
  applied: Record<string, string>;
}) {
  const [items, setItems] = useState(saved);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("saved");

  const kindOf = (s: SavedJob): Exclude<FilterKey, "all"> =>
    applied[s.job.slug] ? "applied" : s.closed ? "closed" : "open";
  const counts = { all: items.length, open: 0, applied: 0, closed: 0 };
  for (const s of items) counts[kindOf(s)]++;
  const active = counts[filter] > 0 ? filter : "all";

  const visible = items
    .filter((s) => active === "all" || kindOf(s) === active)
    .toSorted((a, b) =>
      sort === "posted"
        ? b.postedAt.localeCompare(a.postedAt)
        : b.savedAt.localeCompare(a.savedAt),
    );

  async function unsave(item: SavedJob) {
    setItems((list) => list.filter((s) => s !== item));
    if (!(await updateSavedJob(item.job.slug, false))) {
      setItems((list) => [...list, item]);
      return;
    }
    toast(`Removed ${item.job.designation}`, {
      description: "It's no longer in your saved jobs.",
      action: item.closed
        ? undefined
        : { label: "Undo", onClick: () => resave(item) },
    });
  }

  async function resave(item: SavedJob) {
    setItems((list) => (list.includes(item) ? list : [...list, item]));
    if (!(await updateSavedJob(item.job.slug, true)))
      setItems((list) => list.filter((s) => s !== item));
  }

  if (items.length === 0)
    return (
      <EmptyState
        icon={Heart}
        title="No saved jobs yet"
        action={
          <Button
            className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href="/jobs" />}
          >
            Browse jobs
            <ArrowRight className="size-4" />
          </Button>
        }
      >
        Tap the heart on any job to keep it here, then apply when you&apos;re
        ready.
      </EmptyState>
    );

  return (
    <section aria-label="Saved jobs" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label="Filter saved jobs"
          className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1"
        >
          {FILTERS.filter((f) => f.key === "all" || counts[f.key] > 0).map(
            (f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={active === f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-head text-xs font-semibold whitespace-nowrap transition-colors outline-none sm:flex-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  active === f.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] tabular-nums",
                    active === f.key
                      ? "bg-brand/10 text-brand"
                      : "bg-background/60",
                  )}
                >
                  {counts[f.key]}
                </span>
              </button>
            ),
          )}
        </div>
        <div className="flex flex-none items-center gap-2 text-sm text-muted-foreground">
          Sort by
          <Select
            items={SORTS}
            value={sort}
            onValueChange={(v) => v && setSort(v as SortKey)}
          >
            <SelectTrigger
              size="sm"
              aria-label="Sort saved jobs"
              className="w-40 bg-card font-head font-medium text-foreground"
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
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((s) => (
          <SavedCard
            key={s.job.slug}
            item={s}
            appliedRef={applied[s.job.slug]}
            onUnsave={() => unsave(s)}
          />
        ))}
      </ul>
    </section>
  );
}

function SavedCard({
  item: { job, savedAt, closed },
  appliedRef,
  onUnsave,
}: {
  item: SavedJob;
  appliedRef?: string;
  onUnsave: () => void;
}) {
  const linked = !closed;

  return (
    <li
      className={cn(
        "group relative flex min-w-0 flex-col rounded-2xl border border-border bg-card px-4 pt-4 pb-3 transition-[border-color,box-shadow,translate]",
        linked &&
          "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5",
      )}
    >
      <div className="flex items-start gap-3">
        <CompanyAvatar
          name={job.company}
          logoUrl={job.companyLogoUrl}
          className={cn("size-11 rounded-xl", closed && "opacity-60 grayscale")}
        />
        <div className="min-w-0 flex-1">
          {linked ? (
            <Link
              href={`/jobs/${job.slug}`}
              className="line-clamp-2 font-head leading-snug font-bold tracking-tight transition-colors after:absolute after:inset-0 after:rounded-2xl group-hover:text-brand"
            >
              {job.designation}
            </Link>
          ) : (
            <p className="line-clamp-2 font-head leading-snug font-bold tracking-tight text-muted-foreground">
              {job.designation}
            </p>
          )}
          <p className="truncate text-sm text-muted-foreground">
            {job.company} · {job.industry}
          </p>
        </div>
        <button
          type="button"
          onClick={onUnsave}
          aria-label={`Remove ${job.designation} from saved jobs`}
          title="Remove from saved"
          className="relative z-10 -mt-1.5 -mr-1.5 flex size-9 flex-none items-center justify-center rounded-full text-destructive transition-[background-color,scale] outline-none hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-90"
        >
          <Heart className="size-4.5 fill-current" />
        </button>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <Meta icon={MapPin}>{job.location}</Meta>
        <Meta icon={Briefcase}>{job.experience}</Meta>
        <Meta icon={Clock}>
          {job.jobType} · {job.workMode}
        </Meta>
      </ul>

      <div className="my-4 flex">
        <span
          className={cn(
            "truncate rounded-lg bg-muted px-2.5 py-1.5 font-head text-sm font-bold",
            closed && "text-muted-foreground",
          )}
        >
          <Salary value={job.salaryRange} />
        </span>
      </div>

      <div className="-mx-4 mt-auto flex items-center justify-between gap-3 border-t border-border px-4 pt-3">
        <div className="min-w-0 text-xs text-muted-foreground">
          <p>Saved {formatShortDate(savedAt)}</p>
        </div>
        {appliedRef ? (
          <Button
            variant="outline"
            size="sm"
            className="relative z-10 flex-none font-head"
            nativeButton={false}
            render={
              <Link href={`${CANDIDATE_HOME}/applications/${appliedRef}`} />
            }
          >
            <CircleCheck className="size-3.5 text-good" />
            Applied
          </Button>
        ) : closed ? (
          <span className="flex-none rounded-full bg-muted px-3 py-1.5 font-head text-xs font-bold text-muted-foreground">
            No longer hiring
          </span>
        ) : (
          <Button
            size="sm"
            className="relative z-10 flex-none bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href={`/jobs/${job.slug}`} />}
          >
            Apply now
            <ArrowRight className="size-3.5" />
          </Button>
        )}
      </div>
    </li>
  );
}

function Meta({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex min-w-0 items-center gap-1.5">
      <Icon className="size-3.5 flex-none" />
      <span className="truncate">{children}</span>
    </li>
  );
}
