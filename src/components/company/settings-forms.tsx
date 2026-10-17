"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import {
  Building2,
  CircleAlert,
  Clock,
  ImageIcon,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";

import type { SettingsActionState } from "@/app/(app)/candidate/dashboard/settings/actions";
import {
  cancelCompanyChange,
  removeCompanyLogo,
  requestCompanyChange,
  updateCompanyContact,
  updateCompanyDetails,
  updateCompanyLogo,
} from "@/app/(app)/company/dashboard/settings/actions";
import { Panel } from "@/components/candidate/dashboard-ui";
import {
  FormStatus,
  SubmitButton,
  submitManually,
} from "@/components/candidate/settings-forms";
import {
  SettingsNav,
  type SettingsSection,
} from "@/components/candidate/settings-nav";
import { CompanyAvatar } from "@/components/company-avatar";
import { COMPANY_INTERVIEWS } from "@/components/company/nav";
import {
  Field,
  FieldError,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CHANGE_FIELDS,
  MAX_REASON_LENGTH,
  SUPPORT_EMAIL,
  type ChangeField,
} from "@/lib/company-change-requests";
import { COMPANY_SIZES } from "@/lib/company-verification";
import { toSquarePhoto } from "@/lib/square-photo";
import { INDUSTRIES } from "@/lib/taxonomy";

const INDUSTRY_OPTIONS = INDUSTRIES.map((v) => ({ value: v.slug, label: v.name }));

const SECTIONS: SettingsSection[] = [
  { id: "logo", label: "Company logo", icon: ImageIcon },
  { id: "verified", label: "Verified details", icon: ShieldCheck },
  { id: "details", label: "Company details", icon: Building2 },
  { id: "contact", label: "Contact person", icon: User },
  { id: "security", label: "Password", icon: KeyRound },
  { id: "account", label: "Account", icon: Mail },
];

export function CompanySettingsNav() {
  return <SettingsNav sections={SECTIONS} />;
}

export type CompanyDefaults = {
  propertyName: string;
  industry: string;
  size: string;
  website: string;
  pincode: string;
  contactName: string;
  designation: string;
  phone: string;
};

function SectionForm({
  id,
  title,
  description,
  action,
  successMessage,
  children,
}: {
  id: string;
  title: string;
  description: string;
  action: (prev: SettingsActionState, formData: FormData) => Promise<SettingsActionState>;
  successMessage: string;
  children: (
    errors: Record<string, string | undefined>,
    markDirty: (field: string) => void,
  ) => React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [dirty, setDirty] = useState(false);
  const { errors, formError, clear, clearAll, onChange } = useFieldErrors(
    state,
    state.errors,
    state.error,
  );

  useEffect(() => {
    if (state.ok) toast.success(successMessage);
  }, [state, successMessage]);

  const hasErrors = Object.keys(errors).length > 0 || !!formError;

  return (
    <form
      onSubmit={(e) => {
        setDirty(false);
        clearAll();
        submitManually(formAction)(e);
      }}
      onChange={(e) => {
        setDirty(true);
        onChange(e);
      }}
      noValidate
    >
      <Panel
        id={id}
        title={title}
        description={description}
        footer={
          <>
            <FormStatus
              error={formError}
              pending={dirty ? "You have unsaved changes" : undefined}
            />
            <SubmitButton pending={pending} disabled={!dirty && !hasErrors}>
              {pending ? "Saving..." : "Save changes"}
            </SubmitButton>
          </>
        }
      >
        {children(errors, (field) => {
          setDirty(true);
          clear(field);
        })}
      </Panel>
    </form>
  );
}

export function CompanyDetailsForm({
  defaults,
  city,
  walkInsElsewhere,
}: {
  defaults: CompanyDefaults;
  city: string;
  walkInsElsewhere: number;
}) {
  const [initial] = useState(defaults);
  return (
    <SectionForm
      id="details"
      title="Company details"
      description="Your property's area, size and the industry we match candidates from."
      action={updateCompanyDetails}
      successMessage="Company details saved"
    >
      {(errors, markDirty) => (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            id="propertyName"
            label="Property or branch name"
            optional
            defaultValue={initial.propertyName}
            maxLength={120}
            hint="Shown to candidates alongside your company name."
            error={errors.propertyName}
            className="sm:col-span-2"
          />
          <SelectField
            id="industry"
            label="Industry"
            className="sm:col-span-2"
            options={INDUSTRY_OPTIONS}
            defaultValue={initial.industry}
            onValueChange={() => markDirty("industry")}
            error={errors.industry}
          />
          <SelectField
            id="size"
            label="Company size"
            options={COMPANY_SIZES}
            defaultValue={initial.size}
            onValueChange={() => markDirty("size")}
            error={errors.size}
          />
          <Field
            id="website"
            label="Company website"
            optional
            inputMode="url"
            autoComplete="url"
            placeholder="E.g., tajhotels.com"
            defaultValue={initial.website}
            maxLength={255}
            error={errors.website}
          />
          <Field
            id="pincode"
            label="Pincode"
            inputMode="numeric"
            autoComplete="postal-code"
            defaultValue={initial.pincode}
            maxLength={6}
            hint={`Moved offices within ${city}? Your job postings move with the pincode.`}
            error={errors.pincode}
          />
          {walkInsElsewhere > 0 && (
            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 sm:col-span-2 dark:bg-amber-500/10">
              <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                <CircleAlert className="size-4.5" />
              </span>
              <p className="min-w-0 flex-1 text-sm leading-6 text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {walkInsElsewhere === 1
                    ? "1 upcoming walk-in interview is"
                    : `${walkInsElsewhere} upcoming walk-in interviews are`}{" "}
                  at a different pincode.
                </span>{" "}
                If they were at your old office,{" "}
                <Link
                  href={COMPANY_INTERVIEWS}
                  className="font-semibold text-foreground underline underline-offset-2"
                >
                  reschedule them
                </Link>{" "}
                with the new address so candidates go to the right place.
              </p>
            </div>
          )}
        </div>
      )}
    </SectionForm>
  );
}

export function ContactForm({ defaults }: { defaults: CompanyDefaults }) {
  const [initial] = useState(defaults);
  return (
    <SectionForm
      id="contact"
      title="Contact person"
      description="Who JobClubb and referred candidates hear from."
      action={updateCompanyContact}
      successMessage="Contact details saved"
    >
      {(errors) => (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            id="contactName"
            label="Full name"
            autoComplete="name"
            defaultValue={initial.contactName}
            maxLength={80}
            error={errors.contactName}
          />
          <Field
            id="designation"
            label="Designation"
            autoComplete="organization-title"
            defaultValue={initial.designation}
            maxLength={80}
            error={errors.designation}
          />
          <Field
            id="phone"
            label="Mobile number"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            defaultValue={initial.phone}
            maxLength={16}
            hint="10-digit Indian mobile number."
            error={errors.phone}
          />
        </div>
      )}
    </SectionForm>
  );
}

const LOGO_TYPES = "image/jpeg,image/png,image/webp";
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

export function LogoForm({
  companyName,
  logoUrl,
}: {
  companyName: string;
  logoUrl: string | null;
}) {
  const [uploadState, uploadAction, uploading] = useActionState(updateCompanyLogo, {});
  const [removeState, removeAction, removing] = useActionState(removeCompanyLogo, {});
  const [preview, setPreview] = useOptimistic<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = uploading || removing;

  useEffect(() => {
    if (uploadState.ok) toast.success("Company logo updated");
    if (uploadState.error) toast.error(uploadState.error);
  }, [uploadState]);

  useEffect(() => {
    if (removeState.ok) toast.success("Company logo removed");
    if (removeState.error) toast.error(removeState.error);
  }, [removeState]);

  useEffect(() => {
    if (preview) return () => URL.revokeObjectURL(preview);
  }, [preview]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!LOGO_TYPES.split(",").includes(file.type))
      return toast.error("Choose a JPG, PNG or WebP image.");
    if (file.size > MAX_SOURCE_BYTES)
      return toast.error("That image is too large. Choose one under 20 MB.");

    let logo: File;
    try {
      logo = await toSquarePhoto(file, "contain");
    } catch {
      return toast.error("We couldn't read that image. Try a different one.");
    }

    const data = new FormData();
    data.set("logo", logo);
    startTransition(() => {
      setPreview(URL.createObjectURL(logo));
      uploadAction(data);
    });
  }

  return (
    <Panel
      id="logo"
      title="Company logo"
      description="Shown on your dashboard and to candidates alongside your job postings."
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative size-20 flex-none">
          <CompanyAvatar
            name={companyName}
            logoUrl={preview ?? logoUrl}
            className="size-20 rounded-2xl border border-border text-2xl"
          />
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
              <Loader2 className="size-5 animate-spin text-white" />
            </span>
          )}
        </div>
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={LOGO_TYPES}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={onFileChange}
            />
            <Button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="h-10 bg-brand px-3 font-head text-brand-foreground hover:bg-brand-dark"
            >
              <Upload className="size-4" />
              {uploading ? "Uploading..." : logoUrl ? "Change logo" : "Upload logo"}
            </Button>
            {logoUrl && (
              <Button
                type="button"
                variant="outline-destructive"
                disabled={busy}
                onClick={() => startTransition(() => removeAction())}
                className="h-10 px-3 font-head"
              >
                <Trash2 className="size-4" />
                {removing ? "Removing..." : "Remove"}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG or WebP. We fit it onto a white square without cropping.
          </p>
        </div>
      </div>
    </Panel>
  );
}

export type VerifiedItem = { label: string; value: string; field?: ChangeField };
export type PendingChange = { id: string; field: ChangeField; newValue: string };

export function VerifiedDetails({
  items,
  current,
  pending,
}: {
  items: VerifiedItem[];
  current: Record<ChangeField, string | null>;
  pending: PendingChange[];
}) {
  const [open, setOpen] = useState(false);
  const available = CHANGE_FIELDS.filter(
    (f) => !pending.some((p) => p.field === f.value),
  );

  return (
    <Panel
      id="verified"
      title="Verified details"
      description="Tied to your verified account, so changes are reviewed by our team."
      action={
        <Button
          variant="outline"
          size="sm"
          className="flex-none font-head"
          disabled={available.length === 0}
          onClick={() => setOpen(true)}
        >
          Request a change
        </Button>
      }
    >
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {items.map(({ label, value, field }) => {
          const change = pending.find((p) => p.field === field);
          return (
            <div key={label} className="min-w-0">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3" />
                {label}
              </dt>
              <dd className="mt-0.5 truncate text-sm font-medium">{value}</dd>
              {change && <PendingChangeNote change={change} />}
            </div>
          );
        })}
      </dl>
      <ChangeRequestDialog
        open={open}
        onOpenChange={setOpen}
        fields={available}
        current={current}
      />
    </Panel>
  );
}

function PendingChangeNote({ change }: { change: PendingChange }) {
  const [pending, startTransition] = useTransition();
  return (
    <dd className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
      <Clock className="mt-0.5 size-3 flex-none" />
      <span className="min-w-0">
        <span className="break-words">Requested “{change.newValue}”</span>
        {" · under review · "}
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const { error } = await cancelCompanyChange(change.id);
              if (error) toast.error(error);
              else toast.success("Request withdrawn");
            })
          }
          className="font-semibold underline underline-offset-2 disabled:opacity-50"
        >
          {pending ? "Withdrawing..." : "Withdraw"}
        </button>
      </span>
    </dd>
  );
}

function ChangeRequestDialog({
  open,
  onOpenChange,
  fields,
  current,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: (typeof CHANGE_FIELDS)[number][];
  current: Record<ChangeField, string | null>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-head text-lg font-bold">
            Request a change
          </DialogTitle>
          <DialogDescription>
            Our team reviews every change to verified details. We&apos;ll email
            you once it&apos;s done.
          </DialogDescription>
        </DialogHeader>
        <ChangeRequestForm
          fields={fields}
          current={current}
          onSent={() => {
            onOpenChange(false);
            toast.success("Request sent. We'll email you once it's reviewed.");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function ChangeRequestForm({
  fields,
  current,
  onSent,
}: {
  fields: (typeof CHANGE_FIELDS)[number][];
  current: Record<ChangeField, string | null>;
  onSent: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: SettingsActionState, formData: FormData) => {
      const result = await requestCompanyChange(prev, formData);
      if (result.ok) onSent();
      return result;
    },
    {},
  );
  const { errors, formError, clear, clearAll, onChange } = useFieldErrors(
    state,
    state.errors,
    state.error,
  );
  const [field, setField] = useState<ChangeField | null>(
    fields.length === 1 ? fields[0].value : null,
  );
  const definition = fields.find((f) => f.value === field);

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
      <SelectField
        id="field"
        label="What needs to change?"
        placeholder="Choose a detail"
        options={fields}
        value={field}
        onValueChange={(v) => {
          setField(v as ChangeField | null);
          clear("field");
          clear("newValue");
        }}
        error={errors.field}
      />
      {definition && (
        <Field
          key={definition.value}
          id="newValue"
          label={`New ${definition.label.toLowerCase()}`}
          maxLength={definition.maxLength}
          inputClassName={definition.value === "gstin" ? "uppercase" : undefined}
          hint={`Currently: ${current[definition.value] ?? "Not set"}`}
          error={errors.newValue}
        />
      )}
      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Textarea
          id="reason"
          name="reason"
          rows={3}
          maxLength={MAX_REASON_LENGTH}
          placeholder="E.g., our registered name changed after a merger"
          aria-invalid={!!errors.reason}
          className="max-h-40 overflow-y-auto bg-card"
        />
        <FieldError message={errors.reason} />
      </div>
      {formError && <FormStatus error={formError} />}
      <p className="text-xs text-muted-foreground">
        To change your sign-in email, write to{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-medium text-foreground underline underline-offset-2"
        >
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
      <DialogFooter>
        <DialogClose
          disabled={pending}
          render={<Button variant="outline" className="font-head" />}
        >
          Cancel
        </DialogClose>
        <Button
          type="submit"
          disabled={pending}
          className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          Send request
        </Button>
      </DialogFooter>
    </form>
  );
}
