import Link from "next/link";
import { Briefcase, IndianRupee, MapPin } from "lucide-react";

import { CompanyAvatar } from "@/components/company-avatar";
import type { JobListing } from "@/lib/jobs-data";

// SOP §3.3: unpaid users may see only position, location, experience and salary.
export function JobCard({ job }: { job: JobListing }) {
  return (
    <article className="group min-w-0 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <CompanyAvatar name={job.company} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-head font-bold tracking-tight transition-colors group-hover:text-brand">
            <Link
              href={`/jobs/${job.slug}`}
              className="after:absolute after:inset-0"
            >
              {job.title}
            </Link>
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {job.company}
          </p>
        </div>
        {job.featured && (
          <span className="flex-none rounded-full bg-brand-accent/15 px-2.5 py-1 font-head text-[10px] font-bold tracking-wide text-good uppercase">
            Featured
          </span>
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        <Pill icon={MapPin}>{job.location}</Pill>
        <Pill icon={Briefcase}>{job.experience}</Pill>
        <Pill>{job.vertical}</Pill>
      </ul>

      <div className="mt-4 flex -mx-5 px-5 items-center justify-between border-t border-border pt-4">
        <span className="flex items-center gap-1 font-head text-sm font-bold text-brand">
          <IndianRupee className="size-3.5" />
          {job.salaryRange.replace("₹", "")}
        </span>
        <span className="text-xs text-muted-foreground">{job.postedAgo}</span>
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
