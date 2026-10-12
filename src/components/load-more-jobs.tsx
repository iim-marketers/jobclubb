"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LoadMoreJobs({
  href,
  shown,
  total,
}: {
  href: string;
  shown: number;
  total: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-6 flex flex-col items-center gap-3 sm:grid sm:grid-cols-3">
      <Button
        variant="outline"
        className="font-head sm:col-start-2 sm:row-start-1 sm:justify-self-center"
        disabled={pending}
        onClick={() =>
          startTransition(() => router.replace(href, { scroll: false }))
        }
      >
        {pending && <Loader2 className="animate-spin" />}
        Load more
      </Button>
      <p className="order-first text-center text-xs text-muted-foreground tabular-nums sm:order-none sm:col-start-3 sm:row-start-1 sm:justify-self-end sm:text-right">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {shown.toLocaleString("en-IN")}
        </span>{" "}
        out of{" "}
        <span className="font-semibold text-foreground">
          {total.toLocaleString("en-IN")}
        </span>{" "}
        jobs
      </p>
    </div>
  );
}
