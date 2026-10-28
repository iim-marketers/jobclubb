"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, EyeOff, MailCheck, ShieldAlert } from "lucide-react";

import { registerCompany } from "@/app/(auth)/sign-up/company/actions";
import { CompanyAvatar } from "@/components/company-avatar";
import { ScrollGatedTerms } from "@/components/scroll-gated-terms";
import {
  Field,
  FieldError,
  FileField,
  PasswordField,
  SelectField,
} from "@/components/sign-up/fields";
import {
  PanelCard,
  PanelPoints,
  SignUpLayout,
} from "@/components/sign-up/sign-up-layout";
import {
  StepNav,
  StepPanel,
  StepProgress,
  useStepForm,
} from "@/components/sign-up/step-form";
import { COMPANY_SIZES, checkCompanyEmail } from "@/lib/company-verification";
import { COMPANY_STEPS, validateCompany } from "@/lib/sign-up-validation";
import { COMPANY_INDUSTRY_OPTIONS } from "@/lib/taxonomy";

const EMAIL_STYLES = {
  ok: {
    icon: MailCheck,
    label: "Verify by email",
    panel: "bg-brand-accent/20 text-brand-accent",
    form: "bg-good/10 text-good",
  },
  blocked: {
    icon: ShieldAlert,
    label: "Work email needed",
    panel: "bg-red-400/20 text-red-100",
    form: "bg-destructive/10 text-destructive",
  },
};

export function CompanySignUp() {
  const {
    step,
    isLast,
    errors,
    values,
    pending,
    moved,
    goTo,
    clearError,
    formProps,
  } = useStepForm({
    steps: COMPANY_STEPS,
    validate: validateCompany,
    action: registerCompany,
  });
  const [industry, setIndustry] = useState<string | null>("all");
  const [size, setSize] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [hasRead, setHasRead] = useState(false);

  const emailCheck = checkCompanyEmail(values.email ?? "");

  return (
    <SignUpLayout
      audience="company"
      eyebrow="For employers"
      title={
        <>
          Hire on <span className="text-brand-accent">capability</span>, not
          just CVs.
        </>
      }
      description="Post openings across Airlines, Hospitality and Travel, and review candidates by skills and experience from a verified pool."
      panel={
        <>
          <EmployerBadge
            name={values.companyName}
            property={values.propertyName}
            city={values.city}
            industry={industry}
            size={size}
            email={values.email}
            emailOk={emailCheck?.ok}
          />
          <PanelPoints
            points={[
              {
                icon: Building2,
                text: "One account per property — each location signs up with its own email",
              },
              {
                icon: MailCheck,
                text: "Sign up with your company email and confirm one link — you're verified",
              },
              {
                icon: ShieldAlert,
                text: "Personal addresses like Gmail or Outlook aren't accepted",
              },
              {
                icon: EyeOff,
                text: "Candidate identity stays hidden until you unlock a profile",
              },
            ]}
          />
        </>
      }
    >
      <StepProgress steps={COMPANY_STEPS} current={step} onJump={goTo} />

      <form {...formProps} className="mt-10">
        <StepPanel
          index={0}
          current={step}
          total={3}
          animate={moved}
          step={COMPANY_STEPS[0]}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="companyName"
              label="Registered company name"
              placeholder="E.g., Taj Hotels Ltd."
              autoComplete="organization"
              required
              error={errors.companyName}
              className="sm:col-span-2"
            />
            <Field
              id="propertyName"
              label="Property / office name"
              placeholder="E.g., Taj Bengal, Kolkata"
              hint="The specific hotel, office or branch this account is for. Leave blank if you only have one location."
              optional
              className="sm:col-span-2"
            />
            <SelectField
              id="industry"
              label="Industry"
              options={COMPANY_INDUSTRY_OPTIONS}
              value={industry}
              onValueChange={(v) => {
                setIndustry(v);
                clearError("industry");
              }}
              required
              error={errors.industry}
            />
            <SelectField
              id="size"
              label="Company size"
              options={COMPANY_SIZES}
              placeholder="Select size"
              value={size}
              onValueChange={(v) => {
                setSize(v);
                clearError("size");
              }}
              required
              error={errors.size}
            />
            <Field
              id="website"
              label="Company website"
              placeholder="E.g., tajhotels.com"
              optional
              error={errors.website}
            />
            <Field
              id="gstin"
              label="GSTIN"
              placeholder="E.g., 19AABCT1234F1Z5"
              optional
              error={errors.gstin}
              inputClassName="uppercase placeholder:normal-case"
            />
            <Field
              id="city"
              label="Property city"
              placeholder="E.g., Kolkata"
              autoComplete="address-level2"
              required
              // hint="All jobs are posted here, and it can't be changed later."
              error={errors.city}
            />
            <Field
              id="pincode"
              label="Pincode"
              placeholder="E.g., 700001"
              inputMode="numeric"
              maxLength={6}
              autoComplete="postal-code"
              required
              error={errors.pincode}
            />
          </div>
        </StepPanel>

        <StepPanel
          index={1}
          current={step}
          total={3}
          animate={moved}
          step={COMPANY_STEPS[1]}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="contactName"
              label="Full name"
              placeholder="E.g., Rakesh Nair"
              autoComplete="name"
              required
              error={errors.contactName}
            />
            <Field
              id="designation"
              label="Designation"
              placeholder="E.g., HR Manager"
              autoComplete="organization-title"
              required
              error={errors.designation}
            />
            <div className="space-y-2 sm:col-span-2">
              <Field
                id="email"
                label="Property email"
                type="email"
                placeholder="E.g., hr.kolkata@yourcompany.com"
                hint="Used to sign in. Each property needs its own email — it can't be shared with another location."
                autoComplete="email"
                required
                error={errors.email}
              />
              {emailCheck && !errors.email && (
                <p
                  aria-live="polite"
                  className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs leading-5 ${EMAIL_STYLES[emailCheck.ok ? "ok" : "blocked"].form}`}
                >
                  {emailCheck.reason}
                </p>
              )}
            </div>
            <Field
              id="phone"
              label="Mobile number"
              type="tel"
              placeholder="E.g., 9000000000"
              autoComplete="tel"
              required
              error={errors.phone}
              className="sm:col-span-2"
            />
            <PasswordField
              id="password"
              label="Password"
              placeholder="At least 8 characters"
              required
              error={errors.password}
            />
            <PasswordField
              id="confirmPassword"
              label="Confirm password"
              required
              error={errors.confirmPassword}
            />
          </div>
        </StepPanel>

        <StepPanel
          index={2}
          current={step}
          total={3}
          animate={moved}
          step={COMPANY_STEPS[2]}
        >
          <div className="space-y-8">
            <FileField
              id="proof"
              label="Upload a business document (optional)"
              description="Incorporation or GST certificate, or trade licence · PDF, JPG or PNG, up to 5 MB"
              error={errors.proof}
            />

            <div>
              <ScrollGatedTerms
                employer
                onRead={setHasRead}
                onAccept={(v) => {
                  setAccepted(v);
                  clearError("acceptTerms");
                }}
              />
              <input
                type="hidden"
                name="acceptTerms"
                value={accepted ? "yes" : ""}
              />
              <FieldError message={errors.acceptTerms} />
            </div>
          </div>
        </StepPanel>

        <StepNav
          step={step}
          isLast={isLast}
          pending={pending}
          submitLabel="Register company"
          submitDisabled={!accepted}
          hint={
            accepted
              ? undefined
              : hasRead
                ? "Tick the box above to accept the Terms & Conditions."
                : "Scroll to the end of the Terms & Conditions to continue."
          }
          onBack={() => goTo(step - 1)}
        />
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link
          href="/sign-in"
          className="font-semibold text-brand hover:underline"
        >
          Sign in
        </Link>
      </p>
    </SignUpLayout>
  );
}

function EmployerBadge({
  name,
  property,
  city,
  industry,
  size,
  email,
  emailOk,
}: {
  name?: string;
  property?: string;
  city?: string;
  industry: string | null;
  size: string | null;
  email?: string;
  emailOk?: boolean;
}) {
  const companyName = name?.trim() || "Your company";
  const industryLabel = COMPANY_INDUSTRY_OPTIONS.find(
    (o) => o.value === industry,
  )?.label;
  const sizeLabel = COMPANY_SIZES.find((s) => s.value === size)?.label;
  const status =
    emailOk === undefined ? null : EMAIL_STYLES[emailOk ? "ok" : "blocked"];
  const StatusIcon = status?.icon;

  return (
    <PanelCard
      label="Your employer profile"
      badge={
        status && StatusIcon ? (
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.panel}`}
          >
            <StatusIcon className="size-3" />
            {status.label}
          </span>
        ) : (
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/60">
            Not verified yet
          </span>
        )
      }
    >
      <div className="flex items-center gap-3.5">
        <CompanyAvatar
          name={companyName}
          className="size-12 rounded-2xl text-sm ring-2 ring-white/20"
        />
        <div className="min-w-0">
          <p className="truncate font-head text-lg font-bold">{companyName}</p>
          <p className="truncate text-xs text-white/60">
            {[industryLabel, city?.trim()].filter(Boolean).join(" · ") ||
              "Industry · City"}
          </p>
        </div>
      </div>

      <dl
        data-fit="7"
        className="mt-5 divide-y divide-white/10 rounded-2xl bg-black/15 px-4 text-sm"
      >
        <BadgeRow
          label="Property"
          value={property?.trim() || name?.trim() || "—"}
        />
        <BadgeRow label="Login email" value={email?.trim() || "—"} />
        <BadgeRow label="Company size" value={sizeLabel ?? "—"} />
        <BadgeRow label="Candidate view" value="Skills & experience" />
      </dl>
    </PanelCard>
  );
}

function BadgeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-white/55">{label}</dt>
      <dd className="truncate font-medium text-white/90">{value}</dd>
    </div>
  );
}
