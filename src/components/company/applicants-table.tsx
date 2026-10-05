import { EyeOff } from "lucide-react";

import { StageMeter } from "@/components/candidate/dashboard-ui";
import { formatShortDate } from "@/lib/candidate-activity";
import { STAGES, type Applicant } from "@/lib/company-activity";
import { cn } from "@/lib/utils";

export function ApplicantsTable({
  applicants,
  jobTitles,
}: {
  applicants: Applicant[];
  jobTitles?: Map<string, string>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="pb-3 font-medium">Applicant</th>
            {jobTitles && <th className="pb-3 font-medium">Applied for</th>}
            <th className="pb-3 font-medium">Experience</th>
            <th className="pb-3 font-medium">Skills</th>
            <th className="pb-3 font-medium">Stage</th>
            <th className="pb-3 text-right font-medium">Applied</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {applicants.map((a) => {
            const rejected = a.status === "rejected";
            return (
              <tr key={`${a.jobId}-${a.ref}`} className={cn(rejected && "opacity-60")}>
                <td className="py-3 pr-3">
                  <p className="font-mono text-xs font-semibold">{a.ref}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <EyeOff className="size-3" /> {a.city}
                  </p>
                </td>
                {jobTitles && (
                  <td className="py-3 pr-3 text-muted-foreground">
                    {jobTitles.get(a.jobId) ?? "—"}
                  </td>
                )}
                <td className="py-3 pr-3 text-muted-foreground">
                  {a.experienceYears === 0
                    ? "Fresher"
                    : `${a.experienceYears} ${a.experienceYears === 1 ? "year" : "years"}`}
                </td>
                <td className="py-3 pr-3">
                  <div className="flex flex-wrap gap-1.5">
                    {a.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2.5">
                    <StageMeter stage={a.stage} closed={rejected} className="w-16 flex-none sm:w-16" />
                    <span className="font-head text-xs font-bold">
                      {rejected ? "Not selected" : STAGES[a.stage]}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-right text-muted-foreground">
                  {formatShortDate(a.appliedOn)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function IdentityNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-2xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground",
        className,
      )}
    >
      <EyeOff className="mt-0.5 size-3.5 flex-none" />
      Candidate name, contact details and photo stay hidden until a profile is
      unlocked. You assess applicants on skills and experience first.
    </p>
  );
}
