"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  closeReplacement,
  markDeclined,
  markJoining,
  removeDocument,
  saveReplacement,
  saveTerms,
  sendOffer,
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatRupees } from "@/lib/placements";

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
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
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
        hint="As stated in the offer letter. One month's fee is based on it."
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
        label="Reply by"
        optional
        defaultValue={defaults.offerDeadline ?? undefined}
        hint="When the company needs the candidate's answer."
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
  fresher,
  monthlySalary,
  can,
}: {
  placementId: string;
  candidate: string;
  fresher: boolean;
  monthlySalary: number | null;
  can: {
    send: boolean;
    decline: boolean;
    joining: boolean;
    withdraw: boolean;
  };
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
      {can.send && (
        <ConfirmButton
          label="Send offer letter"
          tone="brand"
          title={`Send the offer letter to ${candidate}?`}
          description={`Only send it once you've confirmed the offer with them${
            fresher
              ? ` and their placement fee${monthlySalary ? ` of ${formatRupees(monthlySalary)}` : ""} is settled outside JobClubb`
              : ""
          }. They get the offer letter and joining details, and the company is told they've confirmed. This can't be undone.`}
          confirmLabel="Send offer letter"
          success="Offer letter sent"
          onConfirm={() => sendOffer(placementId)}
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
          description="Use this when the company has pulled the offer. If the candidate was told they were selected, they're notified. This can't be undone."
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

type ReplacementOption = {
  ref: string;
  name: string;
  jobTitle: string;
  stage: string;
  sameRole: boolean;
};

export function LinkReplacementForm({
  placementId,
  designation,
  options,
}: {
  placementId: string;
  designation: string;
  options: ReplacementOption[];
}) {
  const { formAction, pending, errors, formError, clear, clearAll, onChange } =
    useAdminForm(saveReplacement.bind(null, placementId), "Replacement linked");
  if (options.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        No one else has been referred to this company yet. Screen and refer a
        candidate for the role, then link them here.
      </p>
    );
  const groups = [
    { label: `Same role · ${designation}`, items: options.filter((o) => o.sameRole) },
    { label: "Other roles", items: options.filter((o) => !o.sameRole) },
  ].filter((g) => g.items.length > 0);

  return (
    <form
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
      onChange={onChange}
      noValidate
      className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
    >
      <div className="space-y-2">
        <Label htmlFor="ref">
          Referred candidate <span className="text-destructive">*</span>
        </Label>
        <Select
          name="ref"
          items={Object.fromEntries(
            options.map((o) => [o.ref, `${o.name} · ${o.jobTitle}`]),
          )}
          onValueChange={() => clear("ref")}
        >
          <SelectTrigger
            id="ref"
            className="h-11! w-full bg-card"
            aria-invalid={!!errors.ref}
          >
            <SelectValue placeholder="Choose who replaces them" />
          </SelectTrigger>
          <SelectContent className="max-h-80 w-(--anchor-width) max-w-[calc(100vw-1.5rem)]">
            {groups.map((g, i) => (
              <SelectGroup key={g.label} className="p-0">
                {i > 0 && <SelectSeparator className="mx-0 my-1.5" />}
                <SelectLabel className="sticky top-0 z-10 bg-popover px-2.5 py-1.5 font-head font-semibold">
                  {g.label}
                </SelectLabel>
                {g.items.map((o) => (
                  <SelectItem key={o.ref} value={o.ref} className="py-1.5">
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{o.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {o.sameRole ? "" : `${o.jobTitle} · `}
                        {o.stage} · <span className="font-mono">{o.ref}</span>
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.ref} />
      </div>
      <Button
        type="submit"
        className={`h-11 sm:mt-5.5 ${brandButton}`}
        disabled={pending}
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Link replacement
      </Button>
      {formError && (
        <div className="sm:col-span-2">
          <FormStatus error={formError} />
        </div>
      )}
    </form>
  );
}

export function CloseReplacementForm({ placementId }: { placementId: string }) {
  const { formAction, pending, errors, formError, clearAll, onChange } =
    useAdminForm(closeReplacement.bind(null, placementId), "Replacement closed");
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
      <div className="space-y-2">
        <Label htmlFor="note">Why no replacement is needed</Label>
        <Textarea
          id="note"
          name="note"
          rows={2}
          maxLength={1000}
          placeholder="For example, the company filled the role itself"
          aria-invalid={!!errors.note}
          className="bg-card"
        />
        <FieldError message={errors.note} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <FormStatus error={formError} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="font-head"
          disabled={pending}
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          Close without replacement
        </Button>
      </div>
    </form>
  );
}
