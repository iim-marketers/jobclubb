"use client";

import { useActionState, useState, useTransition } from "react";
import { FilePen, Loader2, MoreHorizontal, Undo2, Upload, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";

import {
  confirmJoining,
  submitOffer,
  withdrawOffer,
  type OfferFormState,
} from "@/app/(app)/company/dashboard/selected/actions";
import { FormStatus, submitManually } from "@/components/candidate/settings-forms";
import { Field, FieldError, FileField, useFieldErrors } from "@/components/sign-up/fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_OFFER_DAYS, MAX_OFFER_FILES, todayIst } from "@/lib/placements";

const brandButton = "bg-brand font-head text-brand-foreground hover:bg-brand-dark";

export type OfferDefaults = {
  monthlySalary: number | null;
  joiningDate: string | null;
  offerDeadline: string | null;
  notes: string;
  documents: number;
};

function OfferDialog({
  placementId,
  candidate,
  defaults,
  open,
  onOpenChange,
}: {
  placementId: string;
  candidate: string;
  defaults: OfferDefaults;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const editing = defaults.documents > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-head text-lg font-bold">
            {editing ? `Offer for ${candidate}` : `Upload the offer for ${candidate}`}
          </DialogTitle>
          <DialogDescription>
            JobClubb checks the offer and shares it with the candidate. You can
            make changes until we do.
          </DialogDescription>
        </DialogHeader>
        <OfferForm
          placementId={placementId}
          defaults={defaults}
          onSaved={() => {
            onOpenChange(false);
            toast.success(editing ? "Offer updated" : "Offer sent to JobClubb");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function OfferForm({
  placementId,
  defaults,
  onSaved,
}: {
  placementId: string;
  defaults: OfferDefaults;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: OfferFormState, formData: FormData) => {
      const result = await submitOffer(placementId, prev, formData);
      if (result.ok) onSaved();
      return result;
    },
    {},
  );
  const { errors, formError, clearAll, onChange } = useFieldErrors(
    state,
    state.errors,
    state.error,
  );
  const remaining = MAX_OFFER_FILES - defaults.documents;

  return (
    <form
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
      onChange={onChange}
      noValidate
      className="grid gap-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        {remaining > 0 ? (
          <FileField
            id="documents"
            label={defaults.documents ? "Add more documents" : "Offer letter"}
            description={
              defaults.documents
                ? `${defaults.documents} uploaded. PDF, JPG or PNG, up to 5 MB per upload.`
                : "PDF, JPG or PNG, up to 5 MB. Add any joining documents too."
            }
            required={!defaults.documents}
            multiple
            error={errors.documents}
          />
        ) : (
          <p className="rounded-2xl bg-muted/50 p-3 text-xs text-muted-foreground">
            {MAX_OFFER_FILES} documents uploaded. Email placement@jobclubb.com to replace one.
          </p>
        )}
      </div>
      <Field
        id="monthlySalary"
        label="Fixed monthly gross salary (₹)"
        required
        inputMode="decimal"
        placeholder="e.g. 25000"
        defaultValue={defaults.monthlySalary ? String(defaults.monthlySalary / 100) : undefined}
        maxLength={12}
        hint="As stated in the offer letter."
        error={errors.monthlySalary}
        className="sm:col-span-2"
      />
      <Field
        id="joiningDate"
        type="date"
        label="Joining date"
        required
        min={todayIst()}
        defaultValue={defaults.joiningDate ?? undefined}
        error={errors.joiningDate}
      />
      <Field
        id="offerDeadline"
        type="date"
        label="Accept by"
        optional
        min={todayIst()}
        defaultValue={defaults.offerDeadline ?? undefined}
        hint={`Leave blank for ${DEFAULT_OFFER_DAYS} days.`}
        error={errors.offerDeadline}
      />
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">
          Joining instructions
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={2000}
          defaultValue={defaults.notes}
          placeholder="Where to report, documents to bring, who to ask for"
          aria-invalid={!!errors.notes}
          className="max-h-40 overflow-y-auto bg-card"
        />
        {errors.notes ? (
          <FieldError message={errors.notes} />
        ) : (
          <p className="text-xs text-muted-foreground">
            The candidate sees this with the offer letter.
          </p>
        )}
      </div>
      {formError && (
        <div className="sm:col-span-2">
          <FormStatus error={formError} />
        </div>
      )}
      <DialogFooter className="sm:col-span-2">
        <DialogClose disabled={pending} render={<Button variant="outline" className="font-head" />}>
          Cancel
        </DialogClose>
        <Button type="submit" className={brandButton} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {defaults.documents ? "Save offer" : "Send to JobClubb"}
        </Button>
      </DialogFooter>
    </form>
  );
}

type Dialogs = "offer" | "joining" | "withdraw" | null;

export function PlacementRowActions({
  placementId,
  candidate,
  offer,
  joiningDue,
  canWithdraw,
  candidateKnows,
}: {
  placementId: string;
  candidate: string;
  offer?: OfferDefaults;
  joiningDue: boolean;
  canWithdraw: boolean;
  candidateKnows: boolean;
}) {
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [pending, startTransition] = useTransition();
  if (!offer && !joiningDue && !canWithdraw) return null;

  const close = (open: boolean) => !open && !pending && setDialog(null);
  const run = (action: () => Promise<{ error?: string }>, success: string) =>
    startTransition(async () => {
      const { error } = await action();
      if (error) {
        toast.error(error);
        return;
      }
      setDialog(null);
      toast.success(success);
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${candidate}`} />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {offer && (
            <DropdownMenuItem onClick={() => setDialog("offer")}>
              {offer.documents > 0 ? <FilePen /> : <Upload />}
              {offer.documents > 0 ? "Edit offer" : "Upload offer"}
            </DropdownMenuItem>
          )}
          {joiningDue && (
            <DropdownMenuItem onClick={() => setDialog("joining")}>
              <UserRoundCheck />
              Record joining
            </DropdownMenuItem>
          )}
          {canWithdraw && (offer || joiningDue) && <DropdownMenuSeparator />}
          {canWithdraw && (
            <DropdownMenuItem variant="destructive" onClick={() => setDialog("withdraw")}>
              <Undo2 />
              Withdraw offer
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {offer && (
        <OfferDialog
          placementId={placementId}
          candidate={candidate}
          defaults={offer}
          open={dialog === "offer"}
          onOpenChange={(open) => setDialog(open ? "offer" : null)}
        />
      )}

      <Dialog open={dialog === "joining"} onOpenChange={close}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="font-head text-lg font-bold">Did {candidate} join?</DialogTitle>
            <DialogDescription>
              Let JobClubb know whether they reported for work. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose disabled={pending} render={<Button variant="outline" className="font-head" />}>
              Back
            </DialogClose>
            <Button
              variant="destructive"
              className="font-head"
              disabled={pending}
              onClick={() => run(() => confirmJoining(placementId, false), "Marked as not joined")}
            >
              Didn&apos;t join
            </Button>
            <Button
              className={brandButton}
              disabled={pending}
              onClick={() => run(() => confirmJoining(placementId, true), "Marked as joined")}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Joined
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "withdraw"} onOpenChange={close}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="font-head text-lg font-bold">
              Withdraw the offer for {candidate}?
            </DialogTitle>
            <DialogDescription>
              {candidateKnows
                ? "JobClubb has already told them they were selected. We'll let them know the offer is withdrawn. This can't be undone."
                : "They haven't been told they were selected, so they'll see this as not selected. This can't be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose disabled={pending} render={<Button variant="outline" className="font-head" />}>
              Back
            </DialogClose>
            <Button
              variant="destructive"
              className="font-head"
              disabled={pending}
              onClick={() => run(() => withdrawOffer(placementId), "Offer withdrawn")}
            >
              {pending ? "Withdrawing…" : "Withdraw offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
