"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useOptimistic,
  useRef,
  useState,
} from "react";
import {
  Building2,
  ImageIcon,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";

import type { SettingsActionState } from "@/app/(app)/candidate/dashboard/settings/actions";
import {
  removeCompanyLogo,
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
import { Field, SelectField, useFieldErrors } from "@/components/sign-up/fields";
import { Button } from "@/components/ui/button";
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
  city: string;
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

export function CompanyDetailsForm({ defaults }: { defaults: CompanyDefaults }) {
  const [initial] = useState(defaults);
  return (
    <SectionForm
      id="details"
      title="Company details"
      description="Where you hire and the industry we match candidates from."
      action={updateCompanyDetails}
      successMessage="Company details saved"
    >
      {(errors, markDirty) => (
        <div className="grid gap-5 sm:grid-cols-2">
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
          <Field
            id="city"
            label="City"
            autoComplete="address-level2"
            defaultValue={initial.city}
            maxLength={80}
            error={errors.city}
          />
          <Field
            id="pincode"
            label="Pincode"
            inputMode="numeric"
            autoComplete="postal-code"
            defaultValue={initial.pincode}
            maxLength={6}
            error={errors.pincode}
          />
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
      description="Who JobClubb and shortlisted candidates hear from."
      action={updateCompanyContact}
      successMessage="Contact details saved"
    >
      {(errors) => (
        <div className="grid gap-5 sm:grid-cols-2">
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
                variant="outline"
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
