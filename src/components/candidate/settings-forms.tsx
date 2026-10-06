"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useOptimistic,
  useRef,
  useState,
} from "react";
import { Camera, Loader2, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  changePassword,
  removePhoto,
  updatePhoto,
  updateProfile,
  type SettingsActionState,
} from "@/app/(app)/candidate/dashboard/settings/actions";
import { CandidateAvatar } from "@/components/candidate/candidate-avatar";
import { Panel } from "@/components/candidate/dashboard-ui";
import {
  Field,
  PasswordField,
  SelectField,
  useFieldErrors,
} from "@/components/sign-up/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toSquarePhoto } from "@/lib/square-photo";
import { INDUSTRIES } from "@/lib/taxonomy";

const INDUSTRY_OPTIONS = INDUSTRIES.map((v) => ({ value: v.slug, label: v.name }));

export type ProfileDefaults = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  pincode: string;
  industry: string;
};

type ProfileKey = Exclude<keyof ProfileDefaults, "email">;

const SECTION_KEYS = {
  personal: ["firstName", "lastName", "phone"],
  preferences: ["city", "pincode", "industry"],
} satisfies Record<string, ProfileKey[]>;

export function submitManually(
  action: (data: FormData) => void,
): React.FormEventHandler<HTMLFormElement> {
  return (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}

export function FormStatus({ error, pending }: { error?: string; pending?: string }) {
  return (
    <p role="status" className="min-h-5 text-sm">
      {error ? (
        <span className="text-destructive">{error}</span>
      ) : pending ? (
        <span className="text-muted-foreground">{pending}</span>
      ) : null}
    </p>
  );
}

export function SubmitButton({
  pending,
  disabled,
  children,
}: {
  pending: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className="h-10 w-full bg-brand px-5 font-head text-brand-foreground hover:bg-brand-dark sm:w-auto"
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}

function ProfileSectionForm({
  section,
  defaults,
  title,
  description,
  successMessage,
  children,
}: {
  section: keyof typeof SECTION_KEYS;
  defaults: ProfileDefaults;
  title: string;
  description: string;
  successMessage: string;
  children: (
    errors: Record<string, string | undefined>,
    markDirty: (field: string) => void,
  ) => React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState<
    SettingsActionState,
    FormData
  >(updateProfile, {});
  const [dirty, setDirty] = useState(false);
  const { errors, formError, clear, clearAll, onChange } = useFieldErrors(
    state,
    state.errors,
    state.error,
  );

  useEffect(() => {
    if (state.ok) toast.success(successMessage);
  }, [state, successMessage]);

  const own: ProfileKey[] = SECTION_KEYS[section];
  const hidden = (Object.keys(defaults) as (keyof ProfileDefaults)[]).filter(
    (k): k is ProfileKey => k !== "email" && !own.includes(k as ProfileKey),
  );
  const hasErrors = Object.keys(errors).length > 0 || !!formError;
  const otherError = hidden.some((k) => state.errors?.[k])
    ? "Some saved details are invalid. Check the other section and save it first."
    : undefined;

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
      {hidden.map((k) => (
        <input key={k} type="hidden" name={k} value={defaults[k]} />
      ))}
      <Panel
        id={section === "personal" ? "profile" : "preferences"}
        title={title}
        description={description}
        footer={
          <>
            <FormStatus
              error={formError ?? otherError}
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

const PHOTO_TYPES = "image/jpeg,image/png,image/webp";
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

export function PhotoForm({
  firstName,
  lastName,
  photoUrl,
}: {
  firstName: string;
  lastName: string;
  photoUrl: string | null;
}) {
  const [uploadState, uploadAction, uploading] = useActionState<
    SettingsActionState,
    FormData
  >(updatePhoto, {});
  const [removeState, removeAction, removing] = useActionState<
    SettingsActionState,
    FormData
  >(removePhoto, {});
  const [preview, setPreview] = useOptimistic<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = uploading || removing;

  useEffect(() => {
    if (uploadState.ok) toast.success("Profile photo updated");
    if (uploadState.error) toast.error(uploadState.error);
  }, [uploadState]);

  useEffect(() => {
    if (removeState.ok) toast.success("Profile photo removed");
    if (removeState.error) toast.error(removeState.error);
  }, [removeState]);

  useEffect(() => {
    if (preview) return () => URL.revokeObjectURL(preview);
  }, [preview]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!PHOTO_TYPES.split(",").includes(file.type))
      return toast.error("Choose a JPG, PNG or WebP image.");
    if (file.size > MAX_SOURCE_BYTES)
      return toast.error("That image is too large. Choose one under 20 MB.");

    let photo: File;
    try {
      photo = await toSquarePhoto(file);
    } catch {
      return toast.error("We couldn't read that image. Try a different one.");
    }

    const data = new FormData();
    data.set("photo", photo);
    startTransition(() => {
      setPreview(URL.createObjectURL(photo));
      uploadAction(data);
    });
  }

  return (
    <Panel
      id="photo"
      title="Profile photo"
      description="Employers only see your photo after you agree to reveal your profile."
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative size-20 flex-none">
          <CandidateAvatar
            firstName={firstName}
            lastName={lastName}
            photoUrl={preview ?? photoUrl}
            className="size-20 bg-linear-to-br from-brand to-brand-accent text-2xl text-white"
          />
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Loader2 className="size-5 animate-spin text-white" />
            </span>
          )}
        </div>
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={PHOTO_TYPES}
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
              <Camera className="size-4" />
              {uploading
                ? "Uploading..."
                : photoUrl
                  ? "Change photo"
                  : "Upload photo"}
            </Button>
            {photoUrl && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  startTransition(() => removeAction(new FormData()))
                }
                className="h-10 font-head px-3"
              >
                <Trash2 className="size-4" />
                {removing ? "Removing..." : "Remove"}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG or WebP. We crop it to a square from the centre.
          </p>
        </div>
      </div>
    </Panel>
  );
}

export function PersonalDetailsForm({
  defaults,
}: {
  defaults: ProfileDefaults;
}) {
  const [initial] = useState(defaults);
  return (
    <ProfileSectionForm
      section="personal"
      defaults={defaults}
      title="Personal details"
      description="How employers see and reach you."
      successMessage="Personal details saved"
    >
      {(errors) => (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="firstName"
            label="First name"
            autoComplete="given-name"
            defaultValue={initial.firstName}
            maxLength={80}
            error={errors.firstName}
          />
          <Field
            id="lastName"
            label="Last name"
            autoComplete="family-name"
            defaultValue={initial.lastName}
            maxLength={80}
            error={errors.lastName}
          />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={defaults.email}
                readOnly
                aria-describedby="email-hint"
                className="h-11 cursor-default bg-muted/60 pr-10 text-muted-foreground"
              />
              <Lock className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <p id="email-hint" className="text-xs text-muted-foreground">
              Your sign-in email. Contact support to change it.
            </p>
          </div>
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
    </ProfileSectionForm>
  );
}

export function PreferencesForm({ defaults }: { defaults: ProfileDefaults }) {
  const [initial] = useState(defaults);
  return (
    <ProfileSectionForm
      section="preferences"
      defaults={defaults}
      title="Job preferences"
      description="We match you to roles in this industry near this location."
      successMessage="Job preferences saved"
    >
      {(errors, markDirty) => (
        <div className="grid gap-5 sm:grid-cols-2">
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
    </ProfileSectionForm>
  );
}

export function PasswordForm({
  action = changePassword,
  description = "Choose a new password for signing in to JobClubb.",
}: {
  action?: (
    prev: SettingsActionState,
    formData: FormData,
  ) => Promise<SettingsActionState>;
  description?: string;
}) {
  const [state, formAction, pending] = useActionState<
    SettingsActionState,
    FormData
  >(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const { errors, formError, clearAll, onChange } = useFieldErrors(
    state,
    state.errors,
    state.error,
  );

  useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
    toast.success("Password updated");
  }, [state]);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
      onChange={onChange}
      noValidate
    >
      <Panel
        id="security"
        title="Password"
        description={description}
        footer={
          <>
            <FormStatus error={formError} />
            <SubmitButton pending={pending}>
              {pending ? "Updating..." : "Update password"}
            </SubmitButton>
          </>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordField
            id="password"
            label="New password"
            hint="At least 8 characters."
            error={errors.password}
          />
          <PasswordField
            id="confirmPassword"
            label="Confirm new password"
            error={errors.confirmPassword}
          />
        </div>
      </Panel>
    </form>
  );
}
