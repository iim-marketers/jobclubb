"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import {
  Banknote,
  Building2,
  CalendarRange,
  KeyRound,
  Loader2,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  createFranchiseAction,
  createPayoutAction,
  extendFranchiseAction,
  approveFranchiseAction,
  rejectFranchiseAction,
  reverseCommissionAction,
  terminateFranchiseAction,
  updateFranchiseAction,
} from "@/app/(admin)/admin/(panel)/franchises/actions";
import type { AdminFormState } from "@/app/(admin)/admin/(panel)/placements/actions";
import {
  adminTableFeatures,
  DataTable,
  formatDate,
  industryName,
} from "@/components/admin/data-table";
import { PasswordInput } from "@/components/admin/partner-company-form";
import { CommissionsTable } from "@/components/franchise/commissions-table";
import {
  FormStatus,
  SubmitButton,
  submitManually,
} from "@/components/candidate/settings-forms";
import {
  Field,
  FieldError,
  ReadOnlyField,
  SelectField,
  useFieldErrors,
} from "@/components/sign-up/fields";
import { FilterSelect } from "@/components/table-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CONSTITUTIONS,
  FRANCHISE_FEE_LABEL,
  daysBetween,
  FRANCHISE_STATUS_BADGES,
  FRANCHISE_STATUS_LABELS,
  defaultEndsOn,
  type FranchiseStatus,
} from "@/lib/franchise";
import {
  ADMIN_PLACEMENT_LABELS,
  addDays,
  formatDateOnly,
  formatRupees,
  placementBadge,
  todayIst,
} from "@/lib/placements";
import { cn } from "@/lib/utils";
import type {
  ApprovedFranchise,
  Franchise,
  FranchiseCandidate,
} from "@/server/franchises/franchises";
import type { Commission } from "@/server/franchises/ledger";

const brandButton =
  "bg-brand font-head text-brand-foreground hover:bg-brand-dark";

function useAdminForm(
  action: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>,
  success?: string,
  onDone?: () => void,
) {
  const [state, formAction, pending] = useActionState(action, {});
  const fields = useFieldErrors(state, state.errors, state.error);
  const handled = useRef<AdminFormState | null>(null);
  useEffect(() => {
    if (!state.ok || handled.current === state) return;
    handled.current = state;
    if (success) toast.success(success);
    onDone?.();
  }, [state, success, onDone]);
  return { state, formAction, pending, ...fields };
}

export function FranchiseStatusBadge({ status }: { status: FranchiseStatus }) {
  return (
    <Badge
      className={cn("font-head font-bold", FRANCHISE_STATUS_BADGES[status])}
    >
      {FRANCHISE_STATUS_LABELS[status]}
    </Badge>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-head font-bold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function TextAreaField({
  id,
  label,
  required,
  optional,
  hint,
  error,
  defaultValue,
  placeholder,
  maxLength,
  rows = 3,
  className,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  defaultValue?: string;
  placeholder?: string;
  maxLength: number;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive">*</span>}
        {optional && (
          <span className="font-normal text-muted-foreground">(optional)</span>
        )}
      </Label>
      <Textarea
        id={id}
        name={id}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="max-h-48 overflow-y-auto bg-card"
      />
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function FranchiseForm({
  franchise,
  showTerms = true,
}: {
  franchise?: Franchise;
  showTerms?: boolean;
}) {
  const editing = !!franchise;
  const router = useRouter();
  const action = editing
    ? updateFranchiseAction.bind(null, franchise.id)
    : createFranchiseAction;
  const { formAction, pending, errors, formError, clear, clearAll, onChange } =
    useAdminForm(action, editing ? "Franchise details saved" : undefined);
  // Revalidation changes the props while mounted; Base UI warns if defaultValue changes.
  const [d] = useState(() => franchise);
  const [startsOn, setStartsOn] = useState(d?.startsOn ?? "");
  const [endsTouched, setEndsTouched] = useState(editing);
  const [endsOn, setEndsOn] = useState(d?.endsOn ?? "");
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
      onChange={onChange}
      noValidate
      className="space-y-6"
    >
      <FormSection
        icon={Building2}
        title="Franchisee"
        description="Who signs the agreement, as written in its opening clause."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            id="name"
            label="Franchise name"
            placeholder="E.g., Kolkata South"
            required
            maxLength={80}
            hint="Shown on the franchise's dashboard and to admins."
            defaultValue={d?.name}
            error={errors.name}
          />
          <Field
            id="legalName"
            label="Legal name"
            placeholder="E.g., Sharma Placements LLP"
            required
            maxLength={120}
            defaultValue={d?.legalName}
            error={errors.legalName}
          />
          <SelectField
            id="constitution"
            label="Constitution"
            required
            placeholder="Choose one"
            options={CONSTITUTIONS}
            defaultValue={d?.constitution}
            onValueChange={() => clear("constitution")}
            error={errors.constitution}
          />
          <Field
            id="ownerName"
            label="Represented by"
            placeholder="E.g., Anita Sharma"
            required
            maxLength={80}
            defaultValue={d?.ownerName}
            error={errors.ownerName}
          />
          <Field
            id="pan"
            label="PAN"
            placeholder="E.g., ABCDE1234F"
            required
            maxLength={10}
            defaultValue={d?.pan}
            error={errors.pan}
            inputClassName="uppercase placeholder:normal-case"
          />
          <Field
            id="gstin"
            label="GSTIN"
            placeholder="E.g., 19AABCT1234F1Z5"
            optional
            maxLength={15}
            defaultValue={d?.gstin ?? undefined}
            error={errors.gstin}
            inputClassName="uppercase placeholder:normal-case"
          />
          <Field
            id="phone"
            label="Mobile number"
            type="tel"
            placeholder="E.g., 9000000000"
            required
            defaultValue={d?.phone}
            error={errors.phone}
          />
          <TextAreaField
            id="registeredAddress"
            label="Registered or residential address"
            required
            maxLength={300}
            rows={2}
            defaultValue={d?.registeredAddress}
            error={errors.registeredAddress}
            className="sm:col-span-2"
          />
        </div>
      </FormSection>

      <FormSection
        icon={MapPin}
        title="Outlet and territory"
        description="Schedule A: where the outlet is and the area it may solicit candidates in."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <TextAreaField
            id="outletAddress"
            label="Outlet address"
            required
            maxLength={300}
            rows={2}
            defaultValue={d?.outletAddress}
            error={errors.outletAddress}
            className="sm:col-span-3"
          />
          <Field
            id="city"
            label="City"
            placeholder="E.g., Kolkata"
            required
            maxLength={80}
            hint={
              editing
                ? undefined
                : "Used in the franchise code, like JC-FR-KOL001."
            }
            defaultValue={d?.city}
            error={errors.city}
          />
          <Field
            id="pincode"
            label="Pincode"
            placeholder="E.g., 700029"
            inputMode="numeric"
            required
            maxLength={6}
            defaultValue={d?.pincode}
            error={errors.pincode}
          />
          <Field
            id="areaSqft"
            label="Area (sq ft)"
            placeholder="E.g., 300"
            inputMode="numeric"
            required
            maxLength={6}
            hint="At least 200 sq ft. Up to 500 sq ft unless approved in writing."
            defaultValue={d?.areaSqft ? String(d.areaSqft) : undefined}
            error={errors.areaSqft}
          />
          {showTerms && <TerritoryFields defaults={d} errors={errors} />}
        </div>
      </FormSection>

      {showTerms && (
        <FormSection
          icon={CalendarRange}
          title="Agreement and franchise fee"
          description={`The franchise fee is ${FRANCHISE_FEE_LABEL}, paid by bank transfer outside JobClubb.`}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field
              id="startsOn"
              type="date"
              label="Agreement starts"
              required
              value={startsOn}
              onChange={(e) => {
                setStartsOn(e.target.value);
                if (!endsTouched && e.target.value)
                  setEndsOn(defaultEndsOn(e.target.value));
              }}
              error={errors.startsOn}
            />
            <Field
              id="endsOn"
              type="date"
              label="Agreement ends"
              required
              value={endsOn}
              min={startsOn || undefined}
              onChange={(e) => {
                setEndsTouched(true);
                setEndsOn(e.target.value);
              }}
              hint="One year by default. Nothing renews automatically."
              error={errors.endsOn}
            />
            <ReadOnlyField label="Franchise fee" value={FRANCHISE_FEE_LABEL} />
            <Field
              id="feePaidOn"
              type="date"
              label="Fee paid on"
              required
              max={todayIst()}
              defaultValue={d?.feePaidOn ?? undefined}
              error={errors.feePaidOn}
            />
            <Field
              id="feePaymentMode"
              label="Payment mode"
              placeholder="E.g., NEFT, RTGS or UPI"
              required
              maxLength={120}
              defaultValue={d?.feePaymentMode ?? undefined}
              error={errors.feePaymentMode}
            />
            <Field
              id="feeTransactionId"
              label="Transaction ID / No."
              placeholder="E.g., HDFCN52026111012345"
              required
              maxLength={60}
              defaultValue={d?.feeTransactionId ?? undefined}
              error={errors.feeTransactionId}
              inputClassName="font-mono"
            />
          </div>
        </FormSection>
      )}

      <FormSection
        icon={Banknote}
        title="Bank details for commission"
        description="Where JobClubb transfers the franchise's commission. Fill in all four, or leave them all blank for now."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            id="bankAccountName"
            label="Account name"
            maxLength={120}
            defaultValue={d?.bankAccountName ?? undefined}
            error={errors.bankAccountName}
          />
          <Field
            id="bankName"
            label="Bank and branch"
            maxLength={120}
            defaultValue={d?.bankName ?? undefined}
            error={errors.bankName}
          />
          <Field
            id="bankAccountNo"
            label="Account number"
            inputMode="numeric"
            maxLength={18}
            defaultValue={d?.bankAccountNo ?? undefined}
            error={errors.bankAccountNo}
          />
          <Field
            id="bankIfsc"
            label="IFSC"
            placeholder="E.g., SBIN0001234"
            maxLength={11}
            defaultValue={d?.bankIfsc ?? undefined}
            error={errors.bankIfsc}
            inputClassName="uppercase placeholder:normal-case"
          />
        </div>
      </FormSection>

      <FormSection
        icon={KeyRound}
        title="Sign-in details"
        description={
          editing
            ? "The franchise signs in with this email. They can reset their own password from the sign-in page."
            : "The franchise signs in with these. Share them once the account is created."
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {editing ? (
            <ReadOnlyField label="Sign-in email" value={d?.email ?? ""} />
          ) : (
            <>
              <Field
                id="email"
                label="Sign-in email"
                type="email"
                placeholder="Any email the franchisee uses"
                autoComplete="off"
                required
                error={errors.email}
              />
              <PasswordInput
                error={errors.password}
                onEdit={() => clear("password")}
              />
            </>
          )}
        </div>
      </FormSection>

      <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <FormStatus
          error={
            formError ??
            (hasErrors
              ? "Fix the highlighted fields and try again."
              : undefined)
          }
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-10 font-head"
            onClick={() =>
              editing ? router.refresh() : router.push("/admin/franchises")
            }
          >
            {editing ? "Discard changes" : "Cancel"}
          </Button>
          <SubmitButton pending={pending}>
            {pending
              ? editing
                ? "Saving..."
                : "Creating..."
              : editing
                ? "Save changes"
                : "Create franchise"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}

const TERRITORY_PLACEHOLDER =
  "E.g., PIN codes 700091, 700097 and 700098, Kolkata";

function TerritoryFields({
  defaults,
  errors,
}: {
  defaults?: Pick<Franchise, "territory" | "exclusive">;
  errors: Partial<Record<string, string>>;
}) {
  const [exclusive, setExclusive] = useState(defaults?.exclusive ?? false);
  const options = [
    {
      value: false,
      title: "Non-exclusive",
      body: "Others may be appointed nearby",
    },
    {
      value: true,
      title: "Exclusive",
      body: "No other franchise in this area",
    },
  ];
  return (
    <>
      <TextAreaField
        id="territory"
        label="Allotted territory"
        required
        maxLength={500}
        rows={2}
        placeholder={TERRITORY_PLACEHOLDER}
        hint="As written in Schedule A."
        defaultValue={defaults?.territory ?? undefined}
        error={errors.territory}
        className="sm:col-span-full"
      />
      <fieldset className="sm:col-span-full">
        <legend className="mb-2 text-sm font-medium">Territorial status</legend>
        <input type="hidden" name="exclusive" value={exclusive ? "yes" : ""} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {options.map((o) => (
            <label
              key={o.title}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-brand/40 has-checked:border-brand has-checked:bg-brand/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
            >
              <input
                type="radio"
                name="exclusiveChoice"
                checked={exclusive === o.value}
                onChange={() => setExclusive(o.value)}
                className="size-4 flex-none accent-brand"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{o.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {o.body}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

function termSummary(startsOn: string, endsOn: string) {
  if (!startsOn || !endsOn || endsOn <= startsOn) return null;
  return endsOn === defaultEndsOn(startsOn)
    ? "1 year"
    : `${daysBetween(startsOn, endsOn) + 1} days`;
}

function FormBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <h3 className="font-head text-sm font-bold">{title}</h3>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

const CHECKLIST = [
  { name: "agreementSigned", label: "The franchise agreement is signed" },
  { name: "feeReceived", label: "The franchise fee is received" },
] as const;

export function ApproveForm({ franchise }: { franchise: Franchise }) {
  const { formAction, pending, errors, formError, clear, clearAll, onChange } =
    useAdminForm(
      approveFranchiseAction.bind(null, franchise.id),
      "Franchise approved",
    );
  const today = todayIst();
  const [startsOn, setStartsOn] = useState(today);
  const [endsOn, setEndsOn] = useState(defaultEndsOn(today));
  const [endsTouched, setEndsTouched] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const ready = CHECKLIST.every((c) => checked[c.name]);
  const hasErrors = Object.keys(errors).length > 0;
  const length = termSummary(startsOn, endsOn);

  return (
    <form
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
      onChange={onChange}
      noValidate
      className="rounded-3xl border border-border bg-card"
    >
      <div className="px-5 pt-6">
        <h2 className="font-head text-xl font-extrabold tracking-tight">
          Approve
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in from the signed agreement. They get their franchise code by
          email.
        </p>
      </div>

      <div className="space-y-8 px-5 py-6">
        <FormBlock title="Franchise">
          <Field
            id="name"
            label="Franchise name"
            required
            maxLength={80}
            defaultValue={franchise.name}
            error={errors.name}
            className="sm:col-span-full"
          />
          <TerritoryFields errors={errors} />
        </FormBlock>

        <FormBlock title="Agreement term">
          <Field
            id="startsOn"
            type="date"
            label="Starts"
            required
            value={startsOn}
            onChange={(e) => {
              setStartsOn(e.target.value);
              if (!endsTouched && e.target.value)
                setEndsOn(defaultEndsOn(e.target.value));
              clear("startsOn");
            }}
            error={errors.startsOn}
          />
          <Field
            id="endsOn"
            type="date"
            label="Ends"
            required
            value={endsOn}
            min={startsOn || undefined}
            onChange={(e) => {
              setEndsTouched(true);
              setEndsOn(e.target.value);
              clear("endsOn");
            }}
            hint={
              length ? `${length}. Doesn't renew automatically.` : undefined
            }
            error={errors.endsOn}
          />
        </FormBlock>

        <FormBlock title="Franchise fee">
          <ReadOnlyField label="Amount" value={FRANCHISE_FEE_LABEL} />
          <Field
            id="feePaidOn"
            type="date"
            label="Received on"
            required
            max={today}
            error={errors.feePaidOn}
          />
          <Field
            id="feePaymentMode"
            label="Payment mode"
            placeholder="E.g., NEFT, RTGS or UPI"
            required
            maxLength={120}
            error={errors.feePaymentMode}
          />
          <Field
            id="feeTransactionId"
            label="Transaction ID / No."
            placeholder="E.g., HDFCN52026111012345"
            required
            maxLength={60}
            error={errors.feeTransactionId}
            inputClassName="font-mono"
          />
        </FormBlock>
      </div>

      <div className="space-y-4 rounded-b-3xl border-t border-border bg-muted/30 px-5 py-5 sm:px-8">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-6">
          {CHECKLIST.map((c) => (
            <label
              key={c.name}
              className="flex cursor-pointer items-center gap-2.5 text-sm"
            >
              <Checkbox
                checked={!!checked[c.name]}
                onCheckedChange={(v) => {
                  setChecked((prev) => ({ ...prev, [c.name]: v }));
                  clear(c.name);
                }}
                aria-invalid={!!errors[c.name]}
              />
              {c.label}
              <input
                type="hidden"
                name={c.name}
                value={checked[c.name] ? "yes" : ""}
              />
            </label>
          ))}
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FormStatus
            error={
              formError ??
              errors.agreementSigned ??
              errors.feeReceived ??
              (hasErrors
                ? "Fix the highlighted fields and try again."
                : undefined)
            }
          />
          <Button
            type="submit"
            disabled={pending || !ready}
            className={cn("h-10 px-5", brandButton)}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? "Approving..." : "Approve and send code"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function RejectButton({ franchiseId }: { franchiseId: string }) {
  return (
    <DialogButton
      label="Reject"
      variant="destructive"
      render={(close) => (
        <DialogForm
          title="Reject this sign-up"
          description="They're emailed your reason and can't sign in. You can still approve them later."
          submitLabel="Reject"
          tone="destructive"
          action={rejectFranchiseAction.bind(null, franchiseId)}
          success="Sign-up rejected"
          onDone={close}
        >
          {(errors) => (
            <TextAreaField
              id="note"
              label="Reason"
              required
              maxLength={500}
              error={errors.note}
            />
          )}
        </DialogForm>
      )}
    />
  );
}

function DialogForm({
  title,
  description,
  submitLabel,
  tone = "brand",
  action,
  success,
  onDone,
  children,
}: {
  title: string;
  description: React.ReactNode;
  submitLabel: string;
  tone?: "brand" | "destructive";
  action: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  success: string;
  onDone: () => void;
  children: (errors: Partial<Record<string, string>>) => React.ReactNode;
}) {
  const { formAction, pending, errors, formError, clearAll, onChange } =
    useAdminForm(action, success, onDone);
  return (
    <form
      noValidate
      onChange={onChange}
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
    >
      <DialogHeader className="border-b border-border px-5 pt-5 pb-4">
        <DialogTitle className="font-head text-lg font-extrabold">
          {title}
        </DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 px-5 py-5">
        {children(errors)}
        <FormStatus error={formError} />
      </div>
      <DialogFooter className="m-0 rounded-b-xl">
        <Button
          type="button"
          variant="outline"
          className="font-head"
          onClick={onDone}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant={tone === "destructive" ? "destructive" : "default"}
          className={tone === "brand" ? brandButton : "font-head"}
          disabled={pending}
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DialogButton({
  label,
  variant = "outline",
  render,
}: {
  label: string;
  variant?: "outline" | "default" | "destructive" | "ghost";
  render: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [instance, setInstance] = useState(0);
  return (
    <>
      <Button
        variant={variant}
        size="sm"
        className={variant === "default" ? brandButton : "font-head"}
        onClick={() => {
          setInstance((n) => n + 1);
          setOpen(true);
        }}
      >
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-md">
          <div key={instance}>{render(() => setOpen(false))}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TermActions({
  franchise,
  status,
}: {
  franchise: ApprovedFranchise;
  status: FranchiseStatus;
}) {
  const today = todayIst();
  const canTerminate = status === "active" || status === "upcoming";
  return (
    <div className="flex flex-wrap gap-2">
      <DialogButton
        label={status === "terminated" ? "Reinstate" : "Extend term"}
        render={(close) => (
          <DialogForm
            title={
              status === "terminated"
                ? "Reinstate this franchise"
                : "Extend the agreement"
            }
            description={
              status === "terminated"
                ? "Clears the termination. Choose when the agreement now ends. Do this only once a renewal or reinstatement is agreed in writing."
                : "Set the new end date once a renewal is agreed in writing (clause 15.2)."
            }
            submitLabel="Save end date"
            action={extendFranchiseAction.bind(null, franchise.id)}
            success="Agreement end date updated"
            onDone={close}
          >
            {(errors) => (
              <Field
                id="endsOn"
                type="date"
                label="Agreement ends"
                required
                defaultValue={defaultEndsOn(
                  franchise.endsOn >= today
                    ? addDays(franchise.endsOn, 1)
                    : today,
                )}
                error={errors.endsOn}
              />
            )}
          </DialogForm>
        )}
      />
      {canTerminate && (
        <DialogButton
          label="Terminate"
          variant="destructive"
          render={(close) => (
            <DialogForm
              title="Terminate this franchise"
              description="After the last day, the franchise can't register candidates and earns no commission on later payments. Commission already earned stays payable."
              submitLabel="Terminate"
              tone="destructive"
              action={terminateFranchiseAction.bind(null, franchise.id)}
              success="Franchise terminated"
              onDone={close}
            >
              {(errors) => (
                <>
                  <Field
                    id="terminatedOn"
                    type="date"
                    label="Last day in force"
                    required
                    hint="With 30 days' notice (clause 16.1), or today for an immediate termination (16.2)."
                    defaultValue={
                      today < franchise.startsOn ? franchise.startsOn : today
                    }
                    error={errors.terminatedOn}
                  />
                  <TextAreaField
                    id="note"
                    label="Reason"
                    required
                    maxLength={500}
                    error={errors.note}
                  />
                </>
              )}
            </DialogForm>
          )}
        />
      )}
    </div>
  );
}

export function PayoutForm({
  franchiseId,
  outstanding,
  hasBank,
}: {
  franchiseId: string;
  outstanding: number;
  hasBank: boolean;
}) {
  const { formAction, pending, errors, formError, clearAll, onChange } =
    useAdminForm(createPayoutAction.bind(null, franchiseId), "Payout recorded");
  return (
    <form
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
      onChange={onChange}
      noValidate
      className="space-y-4"
    >
      {!hasBank && (
        <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
          No bank details on record yet. Add them under Details before
          transferring.
        </p>
      )}
      <input type="hidden" name="expected" value={outstanding} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="paidOn"
          type="date"
          label="Transfer date"
          required
          defaultValue={todayIst()}
          error={errors.paidOn}
        />
        <Field
          id="reference"
          label="UTR / reference"
          required
          maxLength={60}
          placeholder="E.g., HDFCN52026111012345"
          error={errors.reference}
        />
        <TextAreaField
          id="note"
          label="Note"
          optional
          maxLength={500}
          rows={2}
          error={errors.note}
          className="sm:col-span-2"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FormStatus error={formError} />
        <SubmitButton pending={pending}>
          Record transfer of {formatRupees(outstanding)}
        </SubmitButton>
      </div>
    </form>
  );
}

function ReverseButton({
  franchiseId,
  commission,
}: {
  franchiseId: string;
  commission: Commission;
}) {
  const paid = commission.state === "paid";
  return (
    <DialogButton
      label={paid ? "Reverse" : "Cancel"}
      variant="ghost"
      render={(close) => (
        <DialogForm
          title={paid ? "Reverse this commission" : "Cancel this commission"}
          description={
            paid
              ? `${formatRupees(commission.amount)} was already paid to the franchise, so it will be taken off their next payout (clause 9.6).`
              : `${formatRupees(commission.amount)} won't be paid. Use this when the candidate's payment was refunded or charged back, or the registration was a duplicate.`
          }
          submitLabel={paid ? "Reverse commission" : "Cancel commission"}
          tone="destructive"
          action={reverseCommissionAction.bind(
            null,
            franchiseId,
            commission.id,
          )}
          success={paid ? "Commission reversed" : "Commission cancelled"}
          onDone={close}
        >
          {(errors) => (
            <TextAreaField
              id="reason"
              label="Reason"
              required
              maxLength={300}
              error={errors.reason}
            />
          )}
        </DialogForm>
      )}
    />
  );
}

export function AdminCommissionsTable({
  commissions,
  franchiseId,
}: {
  commissions: Commission[];
  franchiseId: string;
}) {
  return (
    <CommissionsTable
      commissions={commissions}
      renderActions={(c) =>
        c.kind !== "reversal" && !c.reversedAt ? (
          <ReverseButton franchiseId={franchiseId} commission={c} />
        ) : null
      }
    />
  );
}

const candidateHelper = createColumnHelper<
  typeof adminTableFeatures,
  FranchiseCandidate
>();

const candidateColumns = candidateHelper.columns([
  candidateHelper.accessor("name", {
    header: "Candidate",
    sortFn: "text",
    cell: ({ row }) => (
      <div className="min-w-40">
        <p className="font-head font-bold">{row.original.name}</p>
        <p className="text-xs text-muted-foreground">{row.original.email}</p>
      </div>
    ),
  }),
  candidateHelper.accessor("email", { header: "Email" }),
  candidateHelper.accessor("phone", {
    header: "Phone",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {getValue()}
      </span>
    ),
  }),
  candidateHelper.accessor((c) => industryName(c.industry), {
    id: "industry",
    header: "Sector",
    sortFn: "text",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()}</span>
    ),
  }),
  candidateHelper.accessor((c) => (c.membershipPaidAt ? 1 : 0), {
    id: "membership",
    header: "Membership",
    sortFn: "basic",
    cell: ({ row }) => (
      <Badge
        className={cn(
          "font-head font-bold",
          row.original.membershipActive
            ? "bg-good/12 text-good"
            : row.original.membershipPaidAt
              ? "bg-muted text-muted-foreground"
              : "bg-amber-500/12 text-amber-700 dark:text-amber-300",
        )}
      >
        {row.original.membershipActive
          ? "Active"
          : row.original.membershipPaidAt
            ? "Expired"
            : "Not paid"}
      </Badge>
    ),
  }),
  candidateHelper.accessor((c) => c.placement ?? "", {
    id: "progress",
    header: "Progress",
    sortFn: "text",
    cell: ({ row }) =>
      row.original.placement ? (
        <Badge
          className={cn(
            "font-head font-bold",
            placementBadge(row.original.placement),
          )}
        >
          {ADMIN_PLACEMENT_LABELS[row.original.placement]}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">
          {row.original.applications}{" "}
          {row.original.applications === 1 ? "application" : "applications"}
        </span>
      ),
  }),
  candidateHelper.accessor("createdAt", {
    header: "Registered",
    sortFn: "basic",
    sortDescFirst: true,
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {formatDate(getValue())}
      </span>
    ),
  }),
]);

export function FranchiseCandidatesTable({
  candidates,
}: {
  candidates: FranchiseCandidate[];
}) {
  return (
    <DataTable
      data={candidates}
      columns={candidateColumns}
      getRowId={(c) => c.id}
      searchable={["name", "email", "phone", "industry"]}
      searchPlaceholder="Search name, email or phone"
      initialSort={{ id: "createdAt", desc: true }}
      columnClass={{
        email: "hidden",
        phone: "hidden lg:table-cell",
        industry: "hidden xl:table-cell",
        progress: "hidden md:table-cell",
        createdAt: "hidden sm:table-cell",
      }}
      emptyTitle="No candidates registered yet"
    />
  );
}

export type FranchiseRow = {
  id: string;
  name: string;
  code: string;
  city: string;
  ownerName: string;
  status: FranchiseStatus;
  lastDay: string;
  candidates: number;
  paidCandidates: number;
  outstanding: number;
};

const franchiseHelper = createColumnHelper<
  typeof adminTableFeatures,
  FranchiseRow
>();

const franchiseColumns = franchiseHelper.columns([
  franchiseHelper.accessor("name", {
    header: "Franchise",
    sortFn: "text",
    cell: ({ row }) => (
      <div className="min-w-40">
        <p className="font-head font-bold">{row.original.name}</p>
        <p className="text-xs text-muted-foreground">
          <span className="font-mono">{row.original.code}</span> ·{" "}
          {row.original.ownerName}
        </p>
      </div>
    ),
  }),
  franchiseHelper.accessor("code", { header: "Code" }),
  franchiseHelper.accessor("ownerName", { header: "Owner" }),
  franchiseHelper.accessor("city", {
    header: "City",
    sortFn: "text",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()}</span>
    ),
  }),
  franchiseHelper.accessor("status", {
    header: "Status",
    sortFn: "text",
    cell: ({ row }) => (
      <div className="flex flex-col items-start gap-0.5">
        <FranchiseStatusBadge status={row.original.status} />
        <span className="text-[11px] whitespace-nowrap text-muted-foreground">
          {row.original.status === "upcoming"
            ? "starts"
            : row.original.status === "active"
              ? "till"
              : "ended"}{" "}
          {formatDateOnly(row.original.lastDay)}
        </span>
      </div>
    ),
  }),
  franchiseHelper.accessor("candidates", {
    header: "Candidates",
    sortFn: "basic",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {row.original.candidates}{" "}
        <span className="text-xs">({row.original.paidCandidates} paid)</span>
      </span>
    ),
  }),
  franchiseHelper.accessor("outstanding", {
    header: "To pay",
    sortFn: "basic",
    sortDescFirst: true,
    cell: ({ getValue }) =>
      getValue() > 0 ? (
        <span className="font-head font-bold whitespace-nowrap text-amber-700 dark:text-amber-300">
          {formatRupees(getValue())}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  }),
]);

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "to-pay", label: "Commission to pay" },
  { value: "upcoming", label: "Starts soon" },
  { value: "ended", label: "Expired or terminated" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

const inFilter = (f: FranchiseRow, filter: StatusFilter) =>
  filter === "all" ||
  (filter === "to-pay"
    ? f.outstanding > 0
    : filter === "ended"
      ? f.status === "expired" || f.status === "terminated"
      : f.status === filter);

export function FranchisesTable({
  franchises,
}: {
  franchises: FranchiseRow[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>("all");
  return (
    <DataTable
      key={filter}
      data={franchises.filter((f) => inFilter(f, filter))}
      columns={franchiseColumns}
      getRowId={(f) => f.id}
      searchable={["name", "code", "city", "ownerName"]}
      searchPlaceholder="Search name, code, owner or city"
      initialSort={{ id: "name", desc: false }}
      columnClass={{
        code: "hidden",
        ownerName: "hidden",
        city: "hidden md:table-cell",
        candidates: "hidden sm:table-cell",
      }}
      onRowClick={(f) => router.push(`/admin/franchises/${f.id}`)}
      emptyTitle="No franchises in this view"
      toolbar={
        <FilterSelect
          label="Show"
          options={STATUS_FILTERS}
          value={filter}
          onChange={setFilter}
        />
      }
    />
  );
}
