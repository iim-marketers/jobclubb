import Link from "next/link";
import { Lock, MapPin, Search, SlidersHorizontal } from "lucide-react";

import { JobCard } from "@/components/job-card";
import { PageHeader, Section } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JOBS } from "@/lib/jobs-data";
import { JOB_TYPES, VERTICALS, WORK_MODES } from "@/lib/taxonomy";

export const metadata = {
  title: "Jobs — JobClubb",
  description:
    "Live openings across Airlines, Hospitality and Travel & Tourism from verified employers.",
};

export default function JobsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Live openings"
        title="Browse jobs"
        description="Verified openings across Airlines, Hospitality and Travel & Tourism. Free to browse — membership unlocks full details and one-click apply."
      >
        <form className="mt-7 flex max-w-3xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-md sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Role, skill or company"
              placeholder="Role, skill or company"
              className="h-11 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="relative flex-1 sm:max-w-55">
            <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="City or pincode"
              placeholder="City or pincode"
              className="h-11 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
            />
          </div>
          <Button
            type="submit"
            className="h-11 bg-brand px-6 font-head text-brand-foreground hover:bg-brand-dark"
          >
            Search
          </Button>
        </form>
      </PageHeader>

      <Section className="py-12!">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="min-w-0 lg:sticky lg:top-18 lg:self-start lg:pt-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 font-head font-bold tracking-tight">
                <SlidersHorizontal className="size-4 text-brand" />
                Filters
              </div>

              <div className="mt-4 -mx-5 divide-y divide-border">
                <FilterGroup title="Sector">
                  <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 lg:grid-cols-1">
                    {VERTICALS.map((v) => (
                      <FilterRow key={v.slug} label={v.name} />
                    ))}
                  </ul>
                </FilterGroup>

                <FilterGroup title="Job type">
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {JOB_TYPES.map((t) => (
                      <FilterChip key={t} label={t} />
                    ))}
                  </ul>
                </FilterGroup>

                <FilterGroup title="Work mode">
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {WORK_MODES.map((m) => (
                      <FilterChip key={m} label={m} />
                    ))}
                  </ul>
                </FilterGroup>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-muted/50 p-4">
              <span className="mt-0.5 flex size-8 flex-none items-center justify-center rounded-lg bg-brand/10">
                <Lock className="size-3.5 text-brand" />
              </span>
              <div className="min-w-0">
                <p className="font-head text-sm font-bold">Location match</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Surface jobs near your home address — members only.
                </p>
                <Link
                  href="/membership"
                  className="mt-2 inline-flex items-center font-head text-xs font-bold text-brand hover:underline"
                >
                  Unlock with membership
                </Link>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 lg:sticky lg:top-18 lg:z-10 lg:-mx-1 lg:border-b lg:border-border lg:bg-background lg:px-1 lg:pt-4 lg:pb-3">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {JOBS.length}
                </span>{" "}
                openings
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Label htmlFor="sort">Sort</Label>
                <Select
                  items={{
                    recent: "Most recent",
                    salary: "Salary: high to low",
                    experience: "Experience: low to high",
                  }}
                  defaultValue="recent"
                >
                  <SelectTrigger
                    id="sort"
                    size="sm"
                    className="w-45 font-head font-medium"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most recent</SelectItem>
                    <SelectItem value="salary">Salary: high to low</SelectItem>
                    <SelectItem value="experience">
                      Experience: low to high
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {JOBS.map((job) => (
                <div key={job.slug} className="relative min-w-0">
                  <JobCard job={job} />
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center">
              <Lock className="mx-auto size-5 text-brand" />
              <p className="mt-3 font-head font-bold tracking-tight">
                More openings inside
              </p>
              <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
                Free browsing shows position, location, experience and salary
                range only. Membership unlocks full job details and one-click
                apply.
              </p>
              <Button
                className="mt-4 bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                nativeButton={false}
                render={<Link href="/membership" />}
              >
                Become a Member
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

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

function filterId(label: string) {
  return `filter-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function FilterRow({ label }: { label: string }) {
  const id = filterId(label);
  return (
    <li className="flex min-w-0 items-center gap-2.5">
      <Checkbox id={id} />
      <Label
        htmlFor={id}
        className="cursor-pointer truncate text-sm font-normal text-muted-foreground hover:text-foreground"
      >
        {label}
      </Label>
    </li>
  );
}

function FilterChip({ label }: { label: string }) {
  const id = filterId(label);
  return (
    <li>
      <input type="checkbox" id={id} className="peer sr-only" />
      <label
        htmlFor={id}
        className="inline-flex cursor-pointer items-center rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50"
      >
        {label}
      </label>
    </li>
  );
}
