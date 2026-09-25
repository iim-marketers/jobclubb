import { Check, ChevronDown, X } from "lucide-react";

import type { AtsReport } from "@/lib/resume";
import { cn } from "@/lib/utils";

export function AtsInsights({ report }: { report: AtsReport }) {
  const passed = report.checks.filter((c) => c.passed).length;

  return (
    <section className="min-w-0 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-head font-bold tracking-tight">ATS checks</h2>
        <span className="text-xs text-muted-foreground">
          {passed}/{report.checks.length} passed
        </span>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5">
        {report.checks.map((check) => (
          <li
            key={check.label}
            className="flex min-w-0 items-center gap-2 text-[13px]"
          >
            <span
              className={cn(
                "flex size-4.5 flex-none items-center justify-center rounded-full",
                check.passed
                  ? "bg-good/15 text-good"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {check.passed ? (
                <Check className="size-3" strokeWidth={3} />
              ) : (
                <X className="size-3" strokeWidth={3} />
              )}
            </span>
            <span
              className={cn(
                "truncate",
                !check.passed && "text-muted-foreground",
              )}
            >
              {check.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-border pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-head font-bold tracking-tight">
            Missing keywords
          </h2>
          <span className="text-xs text-muted-foreground">
            {report.missing.length}
          </span>
        </div>
        {report.missing.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nice — your resume covers every keyword we looked for.
          </p>
        ) : (
          <>
            <KeywordChips keywords={report.missing} />
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              True for you? Add them under &ldquo;Anything to add&rdquo;
              and regenerate.
            </p>
          </>
        )}
      </div>

      {report.matched.length > 0 && (
        <details className="group mt-5 border-t border-border pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            {report.matched.length} keywords matched
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <KeywordChips keywords={report.matched} matched />
        </details>
      )}
    </section>
  );
}

function KeywordChips({
  keywords,
  matched,
}: {
  keywords: string[];
  matched?: boolean;
}) {
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {keywords.map((k) => (
        <li
          key={k}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs",
            matched ? "bg-good/10 text-good" : "bg-muted text-foreground",
          )}
        >
          {k}
        </li>
      ))}
    </ul>
  );
}
