"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Lock } from "lucide-react";

import {
  changePassword,
  updateProfile,
  type SettingsActionState,
} from "@/app/(app)/candidate/dashboard/settings/actions";
import { Panel } from "@/components/candidate/dashboard-ui";
import { Field, PasswordField, SelectField } from "@/components/sign-up/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VERTICALS } from "@/lib/taxonomy";

const SECTOR_OPTIONS = VERTICALS.map((v) => ({ value: v.slug, label: v.name }));

export type ProfileDefaults = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  pincode: string;
  vertical: string;
};

type ProfileKey = Exclude<keyof ProfileDefaults, "email">;

const SECTION_KEYS = {
  personal: ["firstName", "lastName", "phone"],
  preferences: ["city", "pincode", "vertical"],
} satisfies Record<string, ProfileKey[]>;

function submitManually(
  action: (data: FormData) => void,
): React.FormEventHandler<HTMLFormElement> {
  // Submitting manually skips React's automatic form reset, so a failed
  // attempt doesn't wipe what the candidate typed.
  return (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}

function FormStatus({
  error,
  success,
  pending,
}: {
  error?: string;
  success?: string;
  pending?: string;
}) {
  return (
    <p role="status" className="min-h-5 text-sm">
      {error ? (
        <span className="text-destructive">{error}</span>
      ) : success ? (
        <span className="flex items-center gap-1.5 font-medium text-good">
          <CheckCircle2 className="size-4" /> {success}
        </span>
      ) : pending ? (
        <span className="text-muted-foreground">{pending}</span>
      ) : null}
    </p>
  );
}

function SubmitButton({
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

// Personal details and job preferences save independently, but the action
// validates the whole profile, so each form carries the other section's
// saved values as hidden inputs.
function ProfileSectionForm({
  section,
  defaults,
  title,
  description,
  children,
}: {
  section: keyof typeof SECTION_KEYS;
  defaults: ProfileDefaults;
  title: string;
  description: string;
  children: (
    errors: Record<string, string | undefined>,
    markDirty: () => void,
  ) => React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    updateProfile,
    {},
  );
  const [dirty, setDirty] = useState(false);
  const errors = state.errors ?? {};
  const own: ProfileKey[] = SECTION_KEYS[section];
  const hidden = (Object.keys(defaults) as (keyof ProfileDefaults)[]).filter(
    (k): k is ProfileKey => k !== "email" && !own.includes(k as ProfileKey),
  );
  const hasErrors = Object.keys(errors).length > 0 || !!state.error;
  const otherError = hidden.some((k) => errors[k])
    ? "Some saved details are invalid. Check the other section and save it first."
    : undefined;

  return (
    <form
      onSubmit={(e) => {
        setDirty(false);
        submitManually(formAction)(e);
      }}
      onChange={() => setDirty(true)}
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
              error={state.error ?? otherError}
              success={state.ok && !dirty ? "Changes saved" : undefined}
              pending={dirty ? "You have unsaved changes" : undefined}
            />
            <SubmitButton pending={pending} disabled={!dirty && !hasErrors}>
              Save changes
            </SubmitButton>
          </>
        }
      >
        {children(errors, () => setDirty(true))}
      </Panel>
    </form>
  );
}

export function PersonalDetailsForm({ defaults }: { defaults: ProfileDefaults }) {
  return (
    <ProfileSectionForm
      section="personal"
      defaults={defaults}
      title="Personal details"
      description="How employers see and reach you."
    >
      {(errors) => (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="firstName"
            label="First name"
            autoComplete="given-name"
            defaultValue={defaults.firstName}
            maxLength={80}
            error={errors.firstName}
          />
          <Field
            id="lastName"
            label="Last name"
            autoComplete="family-name"
            defaultValue={defaults.lastName}
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
            defaultValue={defaults.phone}
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
  return (
    <ProfileSectionForm
      section="preferences"
      defaults={defaults}
      title="Job preferences"
      description="We match you to roles in this sector near this location."
    >
      {(errors, markDirty) => (
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            id="vertical"
            label="Sector"
            className="sm:col-span-2"
            options={SECTOR_OPTIONS}
            defaultValue={defaults.vertical}
            onValueChange={markDirty}
            error={errors.vertical}
          />
          <Field
            id="city"
            label="City"
            autoComplete="address-level2"
            defaultValue={defaults.city}
            maxLength={80}
            error={errors.city}
          />
          <Field
            id="pincode"
            label="Pincode"
            inputMode="numeric"
            autoComplete="postal-code"
            defaultValue={defaults.pincode}
            maxLength={6}
            error={errors.pincode}
          />
        </div>
      )}
    </ProfileSectionForm>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    changePassword,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.errors ?? {};

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={submitManually(formAction)} noValidate>
      <Panel
        id="security"
        title="Password"
        description="Choose a new password for signing in to JobClubb."
        footer={
          <>
            <FormStatus
              error={state.error}
              success={state.ok ? "Password updated" : undefined}
            />
            <SubmitButton pending={pending}>Update password</SubmitButton>
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
