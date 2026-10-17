"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2, Send, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

import {
  refer,
  reject,
  shortlist,
  type ReferFormState,
} from "@/app/(admin)/admin/(panel)/applications/actions";
import { InterviewDialog } from "@/components/company/interview-actions";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ScreeningState } from "@/lib/screening";

const brandButton = "bg-brand font-head text-brand-foreground hover:bg-brand-dark";

export function ScreeningActions({
  applicationRef,
  state,
  companyName,
}: {
  applicationRef: string;
  state: ScreeningState;
  companyName: string;
}) {
  if (state !== "new" && state !== "interview" && state !== "shortlisted") return null;

  return (
    <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-none sm:flex-wrap">
      <Confirm
        trigger={
          <>
            <UserX className="size-4" /> Not selected
          </>
        }
        title="Mark this candidate as not selected?"
        description="They'll be told JobClubb isn't taking this application further, and any open JobClubb interview is cancelled. This can't be undone."
        confirmLabel="Not selected"
        destructive
        onConfirm={() => reject(applicationRef)}
        success="Marked as not selected"
      />
      {state === "new" && (
        <>
          <Confirm
            trigger={
              <>
                <UserCheck className="size-4" /> Shortlist without interview
              </>
            }
            title="Shortlist without a JobClubb interview?"
            description="Use this only when JobClubb already knows the candidate well. You can then refer them to the employer."
            confirmLabel="Shortlist"
            outline
            onConfirm={() => shortlist(applicationRef)}
            success="Candidate shortlisted"
          />
          <InterviewDialog applicantRef={applicationRef} jobLocation={null} roundNo={0} host="jobclubb" />
        </>
      )}
      {state === "shortlisted" && <ReferDialog applicationRef={applicationRef} companyName={companyName} />}
    </div>
  );
}

function ReferDialog({ applicationRef, companyName }: { applicationRef: string; companyName: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: ReferFormState, formData: FormData) => {
      const result = await refer(applicationRef, prev, formData);
      if (result.ok) {
        setOpen(false);
        toast.success(`Referred to ${companyName}`);
      }
      return result;
    },
    {},
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger render={<Button className={brandButton} />}>
        <Send className="size-4" /> Refer to employer
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-head text-lg font-bold">Refer to {companyName}?</DialogTitle>
          <DialogDescription>
            The employer gets an email and sees the candidate&apos;s name and resume, never their phone
            number or email. The candidate is told they&apos;ve been referred. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="note">JobClubb&apos;s assessment (optional)</Label>
            <Textarea
              id="note"
              name="note"
              rows={4}
              maxLength={2000}
              placeholder="Technical and professional suitability from the first round, shared with the employer."
              aria-invalid={!!state.errors?.note}
            />
            {state.errors?.note && <p className="text-xs text-destructive">{state.errors.note}</p>}
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <DialogClose disabled={pending} render={<Button variant="outline" className="font-head" />}>
              Cancel
            </DialogClose>
            <Button type="submit" className={brandButton} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Refer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Confirm({
  trigger,
  title,
  description,
  confirmLabel,
  destructive,
  outline,
  onConfirm,
  success,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  outline?: boolean;
  onConfirm: () => Promise<{ error?: string }>;
  success: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger
        render={
          <Button
            variant={destructive ? "outline-destructive" : outline ? "outline" : "default"}
            className={destructive || outline ? "font-head" : brandButton}
            disabled={pending}
          />
        }
      >
        {trigger}
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="font-head text-lg font-bold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose disabled={pending} render={<Button variant="outline" className="font-head" />}>
            Back
          </DialogClose>
          <Button
            variant={destructive ? "destructive" : "default"}
            className={destructive ? "font-head" : brandButton}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const { error } = await onConfirm();
                if (error) toast.error(error);
                else {
                  setOpen(false);
                  toast.success(success);
                }
              })
            }
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
