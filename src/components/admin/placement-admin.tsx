"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  extendDeadline,
  markDeclined,
  markJoining,
  release,
  removeDocument,
  saveNotes,
  saveTerms,
  uploadDocuments,
  withdraw,
  type AdminFormState,
} from "@/app/(admin)/admin/(panel)/placements/actions";
import {
  FormStatus,
  submitManually,
} from "@/components/candidate/settings-forms";
import {
  Field,
  FieldError,
  FileField,
  useFieldErrors,
} from "@/components/sign-up/fields";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_OFFER_DAYS } from "@/lib/placements";

const brandButton =
  "bg-brand font-head text-brand-foreground hover:bg-brand-dark";

function useAdminForm(
  action: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>,
  success: string,
) {
  const [state, formAction, pending] = useActionState(action, {});
  const fields = useFieldErrors(state, state.errors, state.error);
  useEffect(() => {
    if (state.ok) toast.success(success);
  }, [state, success]);
  return { state, formAction, pending, ...fields };
}

export function TermsForm({
  placementId,
  defaults,
}: {
  placementId: string;
  defaults: {
    monthlySalary: number | null;
    joiningDate: string | null;
    offerDeadline: string | null;
    notes: string;
  };
}) {
  const { formAction, pending, errors, formError, clearAll, onChange } =
    useAdminForm(saveTerms.bind(null, placementId), "Offer terms saved");
  return (
    <form
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
      onChange={onChange}
      noValidate
      className="grid gap-4 sm:grid-cols-3"
    >
      <Field
        id="monthlySalary"
        label="Monthly gross (₹)"
        required
        inputMode="decimal"
        defaultValue={
          defaults.monthlySalary
            ? String(defaults.monthlySalary / 100)
            : undefined
        }
        maxLength={12}
        hint="The fee is set to this on release."
        error={errors.monthlySalary}
      />
      <Field
        id="joiningDate"
        type="date"
        label="Joining date"
        required
        defaultValue={defaults.joiningDate ?? undefined}
        error={errors.joiningDate}
      />
      <Field
        id="offerDeadline"
        type="date"
        label="Pay by"
        optional
        defaultValue={defaults.offerDeadline ?? undefined}
        hint={`Blank means ${DEFAULT_OFFER_DAYS} days from release.`}
        error={errors.offerDeadline}
      />
      <div className="space-y-2 sm:col-span-3">
        <Label htmlFor="notes">Joining instructions for the candidate</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={2000}
          defaultValue={defaults.notes}
          className="max-h-48 overflow-y-auto bg-card"
        />
        <FieldError message={errors.notes} />
      </div>
      <div className="flex items-center justify-between gap-3 sm:col-span-3">
        <FormStatus error={formError} />
        <Button
          type="submit"
          variant="outline"
          className="font-head"
          disabled={pending}
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save terms
        </Button>
      </div>
    </form>
  );
}

export function ExtendDeadlineForm({
  placementId,
  defaults,
}: {
  placementId: string;
  defaults: { offerDeadline: string; joiningDate: string };
}) {
  const { formAction, pending, errors, formError, clearAll, onChange } =
    useAdminForm(extendDeadline.bind(null, placementId), "Deadline updated");
  return (
    <form
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
      onChange={onChange}
      noValidate
      className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
    >
      <Field
        id="offerDeadline"
        type="date"
        label="Pay by"
        required
        defaultValue={defaults.offerDeadline}
        error={errors.offerDeadline}
      />
      <Field
        id="joiningDate"
        type="date"
        label="Joining date"
        required
        defaultValue={defaults.joiningDate}
        error={errors.joiningDate}
      />
      <Button
        type="submit"
        variant="outline"
        className="font-head sm:mt-7.5"
        disabled={pending}
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Update
      </Button>
      {formError && (
        <div className="sm:col-span-3">
          <FormStatus error={formError} />
        </div>
      )}
    </form>
  );
}

export function UploadDocumentsForm({ placementId }: { placementId: string }) {
  const { formAction, pending, errors, clearAll, onChange, state } =
    useAdminForm(uploadDocuments.bind(null, placementId), "Documents uploaded");
  return (
    <form
      key={state.ok ? "done" : "open"}
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
      onChange={onChange}
      noValidate
      className="space-y-3"
    >
      <FileField
        id="documents"
        label="Add documents"
        description="PDF, JPG or PNG, up to 5 MB per upload."
        multiple
        error={errors.documents}
      />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="font-head"
        disabled={pending}
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Upload
      </Button>
    </form>
  );
}

export function NotesForm({
  placementId,
  notes,
}: {
  placementId: string;
  notes: string;
}) {
  const { formAction, pending, errors, formError, clearAll, onChange } =
    useAdminForm(saveNotes.bind(null, placementId), "Notes saved");
  return (
    <form
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
      onChange={onChange}
      noValidate
      className="space-y-3"
    >
      <Textarea
        id="adminNotes"
        name="adminNotes"
        rows={5}
        maxLength={4000}
        defaultValue={notes}
        placeholder="Calls, follow-ups, anything the team should know. Never shown to the candidate or company."
        className="bg-card"
      />
      <FieldError message={errors.adminNotes} />
      <div className="flex items-center justify-between gap-3">
        <FormStatus error={formError} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="font-head"
          disabled={pending}
        >
          Save notes
        </Button>
      </div>
    </form>
  );
}

function ConfirmButton({
  label,
  title,
  description,
  confirmLabel,
  success,
  tone = "outline",
  onConfirm,
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  success: string;
  tone?: "brand" | "outline" | "destructive";
  onConfirm: () => Promise<{ error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <Button
        variant={
          tone === "brand"
            ? "default"
            : tone === "destructive"
              ? "outline-destructive"
              : "outline"
        }
        className={tone === "brand" ? brandButton : "font-head"}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(next) => !pending && setOpen(next)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={tone === "destructive" ? "destructive" : "default"}
              className={tone === "destructive" ? undefined : brandButton}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const { error } = await onConfirm();
                  if (error) {
                    toast.error(error);
                    return;
                  }
                  setOpen(false);
                  toast.success(success);
                })
              }
            >
              {pending ? "Saving…" : confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function PlacementActions({
  placementId,
  candidate,
  can,
}: {
  placementId: string;
  candidate: string;
  can: {
    release: boolean;
    decline: boolean;
    joining: boolean;
    withdraw: boolean;
  };
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {can.release && (
        <ConfirmButton
          label="Release to candidate"
          tone="brand"
          title={`Release the offer to ${candidate}?`}
          description="They'll be told they were selected and asked to pay the placement fee by the deadline. The fee is fixed at the monthly gross. This can't be undone."
          confirmLabel="Release offer"
          success="Offer released"
          onConfirm={() => release(placementId)}
        />
      )}
      {can.joining && (
        <>
          <ConfirmButton
            label="Mark joined"
            tone="brand"
            title={`Did ${candidate} join?`}
            description="Records that they reported for work. This can't be undone."
            confirmLabel="Mark joined"
            success="Marked as joined"
            onConfirm={() => markJoining(placementId, true)}
          />
          <ConfirmButton
            label="Did not join"
            title={`${candidate} didn't join?`}
            description="Records that they didn't report for work. This can't be undone."
            confirmLabel="Mark not joined"
            success="Marked as not joined"
            onConfirm={() => markJoining(placementId, false)}
          />
        </>
      )}
      {can.decline && (
        <ConfirmButton
          label="Candidate declined"
          title={`Record that ${candidate} declined?`}
          description="Use this when they tell the team they won't take the role. The company is notified. This can't be undone."
          confirmLabel="Record decline"
          success="Decline recorded"
          tone="destructive"
          onConfirm={() => markDeclined(placementId)}
        />
      )}
      {can.withdraw && (
        <ConfirmButton
          label="Withdraw offer"
          title="Withdraw this offer?"
          description="Use this when the company has pulled the offer. If the candidate was told they were selected, they're notified. No refund is issued. This can't be undone."
          confirmLabel="Withdraw offer"
          success="Offer withdrawn"
          tone="destructive"
          onConfirm={() => withdraw(placementId)}
        />
      )}
    </div>
  );
}

export function RemoveDocumentButton({
  placementId,
  documentId,
  name,
}: {
  placementId: string;
  documentId: string;
  name: string;
}) {
  return (
    <ConfirmButton
      label="Remove"
      title={`Remove ${name}?`}
      description="The file is deleted. The company can upload a replacement."
      confirmLabel="Remove"
      success="Document removed"
      tone="destructive"
      onConfirm={() => removeDocument(placementId, documentId)}
    />
  );
}
