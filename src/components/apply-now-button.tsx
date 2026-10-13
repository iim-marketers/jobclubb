"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { applyToJobAction } from "@/app/(jobs)/jobs/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PLACEMENT_FEE_NOTE } from "@/lib/placements";

export function ApplyNowButton({
  slug,
  needsTerms = false,
  className,
}: {
  slug: string;
  needsTerms?: boolean;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [termsOpen, setTermsOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const apply = (acceptTerms = false) =>
    startTransition(async () => {
      const { error, needsTerms: stillNeeded } = await applyToJobAction(slug, acceptTerms);
      if (stillNeeded) {
        setTermsOpen(true);
        return;
      }
      if (error) {
        toast.error(error);
        return;
      }
      setTermsOpen(false);
      toast.success("Application sent", {
        description: "Track its progress from your dashboard.",
      });
    });

  return (
    <>
      <Button
        className={className}
        disabled={pending}
        onClick={() => (needsTerms ? setTermsOpen(true) : apply())}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {pending ? "Sending…" : "Apply now"}
      </Button>
      <Dialog open={termsOpen} onOpenChange={(next) => !pending && setTermsOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-head text-lg font-bold">We&apos;ve updated our terms</DialogTitle>
            <DialogDescription>
              Before you apply, please read how the placement fee works.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm leading-6">
            <p className="rounded-2xl bg-muted/60 p-4">{PLACEMENT_FEE_NOTE}</p>
            <p className="text-muted-foreground">
              You can decline an offer at no cost before paying. Once paid, the
              fee is non-refundable.
            </p>
            <label className="flex cursor-pointer items-start gap-2.5">
              <Checkbox
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked)}
                className="mt-1"
              />
              <span>
                I agree to the updated{" "}
                <Link href="/terms" target="_blank" className="font-medium underline underline-offset-2">
                  Terms &amp; Conditions
                </Link>
                .
              </span>
            </label>
          </div>
          <DialogFooter>
            <DialogClose disabled={pending} render={<Button variant="outline" className="font-head" />}>
              Cancel
            </DialogClose>
            <Button
              className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
              disabled={!agreed || pending}
              onClick={() => apply(true)}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Agree &amp; apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
