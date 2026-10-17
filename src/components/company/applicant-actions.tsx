"use client";

import { useState, useTransition } from "react";
import { UserX } from "lucide-react";
import { toast } from "sonner";

import { reject } from "@/app/(app)/company/dashboard/applicants/actions";
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
import { InterviewDialog } from "@/components/company/interview-actions";

export function ApplicantActions({
  applicantRef,
  jobLocation,
  nextRound,
}: {
  applicantRef: string;
  jobLocation: { city: string; pincode: string };
  nextRound: number | null;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const { error } = await reject(applicantRef);
      if (error) {
        toast.error(error);
        return;
      }
      setConfirming(false);
      toast.success("Applicant marked as not selected");
    });

  return (
    <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-none sm:flex-wrap">
      <Dialog open={confirming} onOpenChange={(next) => !pending && setConfirming(next)}>
        <DialogTrigger render={<Button variant="outline-destructive" className="font-head" disabled={pending} />}>
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
            <Button variant="destructive" className="font-head" disabled={pending} onClick={run}>
              {pending ? "Saving…" : "Not selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {nextRound && (
        <InterviewDialog applicantRef={applicantRef} jobLocation={jobLocation} roundNo={nextRound} />
      )}
    </div>
  );
}
