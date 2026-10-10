"use client";

import { useEffect, useState, useTransition } from "react";
import { ListChecks, Loader2, UserX } from "lucide-react";
import { toast } from "sonner";

import {
  markViewed,
  reject,
  shortlist,
} from "@/app/(app)/company/dashboard/applicants/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Runs on mount rather than during the server render, so a prefetch of this
// page can never count as the employer viewing the applicant.
export function MarkViewed({ applicantRef }: { applicantRef: string }) {
  useEffect(() => {
    void markViewed(applicantRef);
  }, [applicantRef]);
  return null;
}

export function ApplicantActions({
  applicantRef,
  canShortlist,
}: {
  applicantRef: string;
  canShortlist: boolean;
}) {
  const [confirming, setConfirming] = useState<"shortlist" | "reject" | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: "shortlist" | "reject") =>
    startTransition(async () => {
      const { error } = await (action === "shortlist" ? shortlist : reject)(applicantRef);
      if (error) {
        toast.error(error);
        return;
      }
      setConfirming(null);
      toast.success(action === "shortlist" ? "Applicant shortlisted" : "Applicant marked as not selected");
    });

  return (
    <div className="flex flex-none flex-wrap gap-2">
      <Dialog
        open={confirming === "reject"}
        onOpenChange={(next) => !pending && setConfirming(next ? "reject" : null)}
      >
        <DialogTrigger render={<Button variant="outline" className="font-head" disabled={pending} />}>
          <UserX className="size-4" /> Not a fit
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="font-head text-lg font-bold">
              Mark this applicant as not selected?
            </DialogTitle>
            <DialogDescription>
              They&apos;ll see that they weren&apos;t selected for this role.
              This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose disabled={pending} render={<Button variant="outline" className="font-head" />}>
              Cancel
            </DialogClose>
            <Button variant="destructive" className="font-head" disabled={pending} onClick={() => run("reject")}>
              {pending ? "Saving…" : "Not selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {canShortlist && (
        <Dialog
          open={confirming === "shortlist"}
          onOpenChange={(next) => !pending && setConfirming(next ? "shortlist" : null)}
        >
          <DialogTrigger
            render={
              <Button
                className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                disabled={pending}
              />
            }
          >
            <ListChecks className="size-4" /> Shortlist
          </DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle className="font-head text-lg font-bold">
                Shortlist this applicant?
              </DialogTitle>
              <DialogDescription>
                You&apos;ll see their name and can then request an interview.
                Their phone number and email stay with JobClubb.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose disabled={pending} render={<Button variant="outline" className="font-head" />}>
                Cancel
              </DialogClose>
              <Button
                className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                disabled={pending}
                onClick={() => run("shortlist")}
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                {pending ? "Shortlisting…" : "Shortlist"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
