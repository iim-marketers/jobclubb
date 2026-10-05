import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/company-jobs";
import { cn } from "@/lib/utils";

const STYLES: Record<JobStatus, string> = {
  live: "bg-good/12 text-good",
  in_review: "bg-brand/10 text-brand",
  closed: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/10 text-destructive",
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
      {status === "live" && (
        <span className="size-1.5 rounded-full bg-current" aria-hidden />
      )}
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}
