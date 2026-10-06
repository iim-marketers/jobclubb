import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/company-jobs";
import { cn } from "@/lib/utils";

const STYLES: Record<JobStatus, string> = {
  live: "bg-good/12 text-good",
  closed: "bg-muted text-muted-foreground",
};

export function JobStatusPill({
  status,
  className,
}: {
  status: JobStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-0.5 font-head text-[11px] font-bold whitespace-nowrap",
        STYLES[status],
        className,
      )}
    >
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}
