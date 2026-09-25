"use client";

import { useState, useTransition } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Loader2, RotateCcw } from "lucide-react";

import { clearResume } from "@/app/(app)/candidate/dashboard/resume/actions";
import { Button } from "@/components/ui/button";

export function ClearResumeButton() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startClear] = useTransition();

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        setError(undefined);
      }}
    >
      <AlertDialog.Trigger
        render={<Button variant="outline" className="font-head" />}
      >
        <RotateCcw className="size-4" />
        Start over
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/30 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-popover p-6 text-popover-foreground shadow-xl transition duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <RotateCcw className="size-5" />
          </span>
          <AlertDialog.Title className="mt-4 font-head text-lg font-bold tracking-tight">
            Start over?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-1.5 text-sm leading-6 text-muted-foreground">
            This deletes your generated resume and its ATS score. You can build a new one straight
            away.
          </AlertDialog.Description>
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Close
              disabled={pending}
              render={<Button variant="outline" className="font-head" />}
            >
              Cancel
            </AlertDialog.Close>
            <Button
              className="bg-destructive font-head text-white hover:bg-destructive/90"
              disabled={pending}
              onClick={() =>
                startClear(async () => {
                  const result = await clearResume();
                  if (result.error) setError(result.error);
                  else setOpen(false);
                })
              }
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Delete and start over
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
