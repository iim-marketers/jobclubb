"use client";

import { useActionState, useState, useTransition } from "react";
import {
  FilePen,
  Loader2,
  LogOut,
  MoreHorizontal,
  RefreshCw,
  Undo2,
  Upload,
  UserRoundCheck,
} from "lucide-react";
import { toast } from "sonner";

import {
  confirmJoining,
  reportExit,
  submitOffer,
  withdrawOffer,
  type OfferFormState,
} from "@/app/(app)/company/dashboard/selected/actions";
import { FormStatus, submitManually } from "@/components/candidate/settings-forms";
import {
  Field,
  FieldError,
  FileField,
  SelectField,
  useFieldErrors,
} from "@/components/sign-up/fields";
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
import {
  LEFT_REASONS,
  MAX_OFFER_FILES,
  REPLACEMENT_MONTHS,
  formatDateOnly,
  qualifiesForReplacement,
  replacementWindowEnd,
  todayIst,
} from "@/lib/placements";
import { cn } from "@/lib/utils";

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
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
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
        hint="When you need the candidate's answer."
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

export function OfferButton({
  placementId,
  candidate,
  defaults,
}: {
  placementId: string;
  candidate: string;
  defaults: OfferDefaults;
}) {
  const [open, setOpen] = useState(false);
  const editing = defaults.documents > 0;

  return (
    <>
      <Button
        size="sm"
        variant={editing ? "outline" : "default"}
        className={editing ? "font-head" : brandButton}
        onClick={() => setOpen(true)}
      >
        {editing ? <FilePen /> : <Upload />}
        {editing ? "Edit offer" : "Upload offer letter"}
      </Button>
      <OfferDialog
        placementId={placementId}
        candidate={candidate}
        defaults={defaults}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

const REASON_OPTIONS = Object.entries(LEFT_REASONS).map(([value, label]) => ({ value, label }));

function ReplacementNote({
  joiningDate,
  resignedOn,
  replaceable,
}: {
  joiningDate: string;
  resignedOn: string;
  replaceable: boolean;
}) {
  const windowEnd = replacementWindowEnd(joiningDate);
  const [tone, text] = !replaceable
    ? ["muted", "They joined as a replacement, so no further replacement applies."]
    : !resignedOn
      ? [
          "muted",
          `If they resigned by ${formatDateOnly(windowEnd)}, within ${REPLACEMENT_MONTHS} months of joining, JobClubb refers a replacement candidate.`,
        ]
      : qualifiesForReplacement(joiningDate, resignedOn)
        ? [
            "good",
            `They resigned within ${REPLACEMENT_MONTHS} months of joining, so JobClubb will refer a replacement candidate.`,
          ]
        : [
            "muted",
            `They resigned more than ${REPLACEMENT_MONTHS} months after joining, so no replacement applies.`,
          ];
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-2xl p-3 text-xs leading-5 sm:col-span-2",
        tone === "good" ? "bg-good/10 text-good" : "bg-muted/50 text-muted-foreground",
      )}
    >
      <RefreshCw className="mt-0.5 size-3.5 flex-none" />
      {text}
    </p>
  );
}

function ExitForm({
  placementId,
  joiningDate,
  replaceable,
  onSaved,
}: {
  placementId: string;
  joiningDate: string;
  replaceable: boolean;
  onSaved: (replacementOwed: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: OfferFormState, formData: FormData) => {
      const result = await reportExit(placementId, joiningDate, prev, formData);
      if (result.ok) onSaved(!!result.replacementOwed);
      return result;
    },
    {},
  );
  const { errors, formError, clear, clearAll, onChange } = useFieldErrors(
    state,
    state.errors,
    state.error,
  );
  const [reason, setReason] = useState<string | null>(null);
  const [resignedOn, setResignedOn] = useState("");
  const resigned = reason === "resigned";

  return (
    <form
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
      onChange={(e) => {
        onChange(e);
        const target = e.target;
        if (target instanceof HTMLInputElement && target.name === "resignedOn")
          setResignedOn(target.value);
      }}
      noValidate
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <SelectField
        id="reason"
        label="What happened"
        required
        options={REASON_OPTIONS}
        placeholder="Choose one"
        onValueChange={(value) => {
          setReason(value);
          clear("reason");
        }}
        error={errors.reason}
        className="sm:col-span-2"
      />
      {resigned && (
        <Field
          id="resignedOn"
          type="date"
          label="Date they resigned"
          required
          min={joiningDate}
          hint="When they handed in their notice."
          error={errors.resignedOn}
        />
      )}
      <Field
        id="leftOn"
        type="date"
        label="Last working day"
        required
        min={joiningDate}
        error={errors.leftOn}
        className={resigned ? undefined : "sm:col-span-2"}
      />
      {resigned && (
        <ReplacementNote
          joiningDate={joiningDate}
          resignedOn={resignedOn}
          replaceable={replaceable}
        />
      )}
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="notes">Note for JobClubb (optional)</Label>
        <Textarea id="notes" name="notes" rows={3} maxLength={1000} aria-invalid={!!errors.notes} />
        <FieldError id="notes-error" message={errors.notes} />
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
          Report to JobClubb
        </Button>
      </DialogFooter>
    </form>
  );
}

function JoiningDialog({
  placementId,
  candidate,
  open,
  onOpenChange,
}: {
  placementId: string;
  candidate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const record = (joined: boolean) =>
    startTransition(async () => {
      const { error } = await confirmJoining(placementId, joined);
      if (error) {
        toast.error(error);
        return;
      }
      onOpenChange(false);
      toast.success(joined ? "Marked as joined" : "Marked as not joined");
    });

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
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
            onClick={() => record(false)}
          >
            Didn&apos;t join
          </Button>
          <Button className={brandButton} disabled={pending} onClick={() => record(true)}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Joined
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExitDialog({
  placementId,
  candidate,
  joiningDate,
  replaceable,
  open,
  onOpenChange,
}: {
  placementId: string;
  candidate: string;
  joiningDate: string;
  replaceable: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-head text-lg font-bold">Has {candidate} left?</DialogTitle>
          <DialogDescription>
            Under our agreement, tell JobClubb promptly when someone placed
            through us resigns, is terminated or stops working with you for any
            other reason. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <ExitForm
          placementId={placementId}
          joiningDate={joiningDate}
          replaceable={replaceable}
          onSaved={(replacementOwed) => {
            onOpenChange(false);
            toast.success(
              replacementOwed
                ? "Reported. JobClubb will refer a replacement."
                : "Reported to JobClubb",
            );
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export function JoiningButton({
  placementId,
  candidate,
}: {
  placementId: string;
  candidate: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" className={brandButton} onClick={() => setOpen(true)}>
        <UserRoundCheck />
        Record joining
      </Button>
      <JoiningDialog
        placementId={placementId}
        candidate={candidate}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

export function ExitButton({
  placementId,
  candidate,
  joiningDate,
  replaceable,
}: {
  placementId: string;
  candidate: string;
  joiningDate: string;
  replaceable: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" className="font-head" onClick={() => setOpen(true)}>
        <LogOut />
        Report exit
      </Button>
      <ExitDialog
        placementId={placementId}
        candidate={candidate}
        joiningDate={joiningDate}
        replaceable={replaceable}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

type Dialogs = "offer" | "joining" | "withdraw" | "exit" | null;

export function PlacementRowActions({
  placementId,
  candidate,
  offer,
  joiningDue,
  canWithdraw,
  candidateKnows,
  exitFrom,
  replaceable = false,
}: {
  placementId: string;
  candidate: string;
  offer?: OfferDefaults;
  joiningDue: boolean;
  canWithdraw: boolean;
  candidateKnows: boolean;
  exitFrom?: string;
  replaceable?: boolean;
}) {
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [pending, startTransition] = useTransition();
  if (!offer && !joiningDue && !canWithdraw && !exitFrom) return null;

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
          {exitFrom && (
            <DropdownMenuItem onClick={() => setDialog("exit")}>
              <LogOut />
              Report exit
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

      {joiningDue && (
        <JoiningDialog
          placementId={placementId}
          candidate={candidate}
          open={dialog === "joining"}
          onOpenChange={(open) => setDialog(open ? "joining" : null)}
        />
      )}

      {exitFrom && (
        <ExitDialog
          placementId={placementId}
          candidate={candidate}
          joiningDate={exitFrom}
          replaceable={replaceable}
          open={dialog === "exit"}
          onOpenChange={(open) => setDialog(open ? "exit" : null)}
        />
      )}

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
