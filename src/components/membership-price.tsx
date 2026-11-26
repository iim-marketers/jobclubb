import { Clock } from "lucide-react";

import { PLAN_DETAILS, type MembershipPlan } from "@/lib/membership";
import { cn } from "@/lib/utils";

export function MembershipPrice({
  plan,
  suffix = "/ year",
  onDark = false,
  className,
}: {
  plan: MembershipPlan;
  suffix?: string;
  onDark?: boolean;
  className?: string;
}) {
  const { price, amount, listPrice, listAmount } = PLAN_DETAILS[plan];
  const percentOff =
    listAmount && Math.round(((listAmount - amount) / listAmount) * 100);

  return (
    <div className={className}>
      {listPrice && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-head text-xs font-bold",
              onDark
                ? "bg-white/15 text-white"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
            )}
          >
            <Clock className="size-3" strokeWidth={2.5} />
            Limited-time offer
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 font-head text-xs font-bold",
              onDark ? "bg-white text-brand" : "bg-good/10 text-good",
            )}
          >
            Save {percentOff}%
          </span>
        </div>
      )}
      <p className="flex flex-wrap items-baseline gap-x-2">
        {listPrice && (
          <span
            className={cn(
              "font-head text-xl font-bold line-through",
              onDark ? "text-white/60" : "text-muted-foreground",
            )}
          >
            {listPrice}
          </span>
        )}
        <span
          className={cn(
            "font-head text-4xl font-extrabold tracking-tight",
            !onDark && "text-brand",
          )}
        >
          {price}
        </span>
        <span
          className={cn(
            "text-sm",
            onDark ? "text-white/75" : "text-muted-foreground",
          )}
        >
          {suffix}
        </span>
      </p>
    </div>
  );
}
