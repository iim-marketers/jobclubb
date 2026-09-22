import Link from "next/link";
import { Briefcase, IndianRupee, MapPin } from "lucide-react";

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
  vertical: "Category",
  salaryRange: "₹0 LPA – 0 LPA",
  postedAgo: "Recently",
};

export function JobCard({ job, locked }: { job: JobListing; locked: boolean }) {
  const shown = locked ? PLACEHOLDER : job;
  const hidden = locked ? HIDDEN : undefined;

  return (
    <article className="group min-w-0 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        {locked ? (
          <span
            aria-hidden
            className={cn("size-10 flex-none rounded-full bg-muted", HIDDEN)}
          />
        ) : (
          <CompanyAvatar name={job.company} />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-head font-bold tracking-tight transition-colors group-hover:text-brand">
            <Link
              href={`/jobs/${job.slug}`}
              className="after:absolute after:inset-0"
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
          <span className="flex-none rounded-full bg-brand-accent/15 px-2.5 py-1 font-head text-[10px] font-bold tracking-wide text-good uppercase">
            Featured
          </span>
        )}
      </div>

      <ul
        aria-hidden={locked}
        className={cn("mt-4 flex flex-wrap gap-2", hidden)}
      >
        <Pill icon={MapPin}>{shown.location}</Pill>
        <Pill icon={Briefcase}>{shown.experience}</Pill>
        <Pill>{shown.vertical}</Pill>
      </ul>

      <div
        aria-hidden={locked}
        className="mt-4 flex -mx-5 px-5 items-center justify-between border-t border-border pt-4"
      >
        <span
          className={cn(
            "flex items-center gap-1 font-head text-sm font-bold text-brand",
            hidden,
          )}
        >
          <IndianRupee className="size-3.5" />
          {shown.salaryRange.replace("₹", "")}
        </span>
        <span className={cn("text-xs text-muted-foreground", hidden)}>
          {shown.postedAgo}
        </span>
      </div>
    </article>
  );
}

function Pill({
  icon: Icon,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
      {Icon && <Icon className="size-3" />}
      {children}
    </li>
  );
}
