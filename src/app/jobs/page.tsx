import Link from "next/link";
import { Lock, MapPin, Search, SlidersHorizontal } from "lucide-react";

import { JobCard } from "@/components/job-card";
import { PageHeader, PageShell, Section } from "@/components/page-shell";
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
    <PageShell>
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
          <div className="relative flex-1 sm:max-w-[220px]">
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

      <Section>
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Filters */}
          <aside className="min-w-0 space-y-7">
            <div className="flex items-center gap-2 font-head font-bold tracking-tight">
              <SlidersHorizontal className="size-4 text-brand" />
              Filters
            </div>

            <FilterGroup title="Sector">
              {VERTICALS.map((v) => (
                <FilterRow key={v.slug} label={v.name} />
              ))}
            </FilterGroup>

            <FilterGroup title="Job type">
              {JOB_TYPES.map((t) => (
                <FilterRow key={t} label={t} />
              ))}
            </FilterGroup>

            <FilterGroup title="Work mode">
              {WORK_MODES.map((m) => (
                <FilterRow key={m} label={m} />
              ))}
            </FilterGroup>

            {/* SOP §3.4 — members only */}
            <div className="rounded-2xl border border-border bg-muted/50 p-4">
              <div className="flex items-center gap-2 font-head text-sm font-bold">
                <Lock className="size-3.5 text-brand" />
                Location match
              </div>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                Surface jobs near your home address. Available to members only.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 w-full font-head"
                nativeButton={false}
                render={<Link href="/membership" />}
              >
                Unlock
              </Button>
            </div>
          </aside>

          {/* Results */}
          <div className="min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{JOBS.length}</span>{" "}
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
                  <SelectTrigger id="sort" size="sm" className="w-[180px] font-head font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most recent</SelectItem>
                    <SelectItem value="salary">Salary: high to low</SelectItem>
                    <SelectItem value="experience">Experience: low to high</SelectItem>
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
                Free browsing shows position, location, experience and salary range only.
                Membership unlocks full job details and one-click apply.
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
    </PageShell>
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
    <div>
      <h3 className="font-head text-sm font-bold tracking-tight">{title}</h3>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

function FilterRow({ label }: { label: string }) {
  const id = `filter-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <li className="flex items-center gap-2.5">
      <Checkbox id={id} />
      <Label
        htmlFor={id}
        className="cursor-pointer text-sm font-normal text-muted-foreground hover:text-foreground"
      >
        {label}
      </Label>
    </li>
  );
}
