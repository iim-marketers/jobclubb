"use client";

import { useState, useTransition } from "react";
import { Loader2, LockKeyhole, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { setJobOpen } from "@/app/(app)/company/dashboard/jobs/actions";
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

export function JobOpenToggle({ jobId, closed }: { jobId: string; closed: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const { error } = await setJobOpen(jobId, closed);
      if (error) {
        toast.error(error);
        return;
      }
      setOpen(false);
      toast.success(closed ? "Posting reopened" : "Posting closed");
    });

  if (closed)
    return (
      <Button
        variant="outline"
        className="font-head"
        disabled={pending}
        onClick={run}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RotateCcw className="size-4" />
        )}
        Reopen
      </Button>
    );

  return (
    <Dialog open={pending || open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger render={<Button variant="outline" className="font-head" />}>
        <LockKeyhole className="size-4" /> Close posting
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="font-head text-lg font-bold">
            Close this posting?
          </DialogTitle>
          <DialogDescription>
            It comes off the job board and stops taking applications. Applicants
            you already have stay here, and you can reopen it later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            disabled={pending}
            render={<Button variant="outline" className="font-head" />}
          >
            Keep open
          </DialogClose>
          <Button
            variant="destructive"
            className="font-head"
            disabled={pending}
            onClick={run}
          >
            {pending ? "Closing…" : "Close posting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
