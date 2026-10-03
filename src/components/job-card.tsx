import Link from "next/link";
import { ArrowRight, Briefcase, Clock, Lock, MapPin } from "lucide-react";

import { CompanyAvatar } from "@/components/company-avatar";
import type { JobListing } from "@/lib/jobs-data";
import { cn } from "@/lib/utils";

const HIDDEN = "blur-[5px] select-none";

// Without an active membership only the role is real; the rest is placeholder
// text under a blur, so the details never reach the page.
const PLACEHOLDER = {
  company: "Company name",
  location: "City, State",
  experience: "0 – 0 years",
  salaryRange: "₹0 LPA – 0 LPA",
  postedAgo: "Recently",
  workMode: "Onsite",
};

export function JobCard({ job, locked }: { job: JobListing; locked: boolean }) {
  const shown = locked ? PLACEHOLDER : job;
  const hidden = locked ? HIDDEN : undefined;

  return (
    <article className="group relative flex h-full min-w-0 flex-col rounded-2xl border border-border bg-card p-4 transition-[border-color,box-shadow] hover:border-brand/40 hover:shadow-md sm:p-5">
      <div className="flex items-start gap-3">
        {locked ? (
          <span
            aria-hidden
            className={cn("size-11 flex-none rounded-xl bg-muted", HIDDEN)}
          />
        ) : (
          <CompanyAvatar name={job.company} className="size-11 rounded-xl" />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-head leading-snug font-bold tracking-tight transition-colors group-hover:text-brand">
            <Link
              href={`/jobs/${job.slug}`}
              className="after:absolute after:inset-0 after:rounded-2xl"
            >
              {job.title}
            </Link>
          </h3>
          <p
            aria-hidden={locked}
            className={cn("truncate text-sm text-muted-foreground", hidden)}
          >
            {shown.company}
          </p>
        </div>
        {!locked && job.featured && (
          <span className="flex-none rounded-full bg-brand-accent/15 px-2 py-0.5 font-head text-[10px] font-bold tracking-wide text-good uppercase">
            Featured
          </span>
        )}
      </div>

      <ul
        aria-hidden={locked}
        className={cn(
          "mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground",
          hidden,
        )}
      >
        <Meta icon={MapPin}>{shown.location}</Meta>
        <Meta icon={Briefcase}>{shown.experience}</Meta>
        <Meta icon={Clock}>{shown.workMode}</Meta>
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5">
          {locked && <Lock className="size-3 flex-none text-brand" />}
          <span
            aria-hidden={locked}
            className={cn(
              "truncate font-head text-sm font-bold text-foreground",
              hidden,
            )}
          >
            {shown.salaryRange}
          </span>
        </div>
        <div className="flex flex-none items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden={locked} className={hidden}>
            {shown.postedAgo}
          </span>
          <ArrowRight className="size-4 text-brand transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </article>
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
