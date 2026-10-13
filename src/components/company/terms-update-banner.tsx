"use client";

import Link from "next/link";
import { useTransition } from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { acceptCompanyTerms } from "@/app/(app)/company/actions";
import { Button } from "@/components/ui/button";

export function TermsUpdateBanner() {
  const [pending, startTransition] = useTransition();
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 p-4 dark:bg-amber-500/10">
      <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
        <FileText className="size-4.5" />
      </span>
      <p className="min-w-0 flex-1 basis-64 text-sm leading-6 text-muted-foreground">
        <span className="font-semibold text-foreground">We have new employer terms.</span>{" "}
        Offers to candidates you find on JobClubb now go through JobClubb: you
        upload the offer here and we share it with the candidate. Please review
        and accept the{" "}
        <Link href="/employer-terms" target="_blank" className="font-medium text-foreground underline underline-offset-2">
          employer terms
        </Link>{" "}
        to keep posting jobs.
      </p>
      <Button
        className="w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark sm:w-auto"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const { error } = await acceptCompanyTerms();
            if (error) toast.error(error);
            else toast.success("Thanks, the updated terms are accepted");
          })
        }
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Accept terms
      </Button>
    </div>
  );
}
