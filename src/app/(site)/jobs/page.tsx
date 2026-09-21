import Link from "next/link";
import { Lock, MapPin, Search } from "lucide-react";

import { JobCard } from "@/components/job-card";
import { JobFiltersPanel, JobFiltersSheet } from "@/components/job-filters";
import { PageHeader, Section } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
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
          <aside className="hidden min-w-0 lg:sticky lg:block lg:top-18 lg:self-start lg:pt-4">
            <JobFiltersPanel />

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
            <div className="sticky top-16 z-10 -mx-4 border-b border-border bg-background/95 px-4 pt-3 pb-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-18 lg:-mx-1 lg:bg-background lg:px-1 lg:pt-4 lg:backdrop-blur-none">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <JobFiltersSheet />
                  <p className="hidden text-sm text-muted-foreground sm:block lg:block">
                    Showing{" "}
                    <span className="font-semibold text-foreground">
                      {JOBS.length}
                    </span>{" "}
                    openings
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Label htmlFor="sort" className="hidden sm:block">
                    Sort
                  </Label>
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
                      aria-label="Sort openings"
                      className="w-40 font-head font-medium sm:w-45"
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
            </div>

            <p className="mt-4 text-sm text-muted-foreground sm:hidden">
              Showing{" "}
              <span className="font-semibold text-foreground">
                {JOBS.length}
              </span>{" "}
              openings
            </p>

            <div className="mt-3 grid gap-4 sm:mt-5 sm:grid-cols-2">
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
