"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Building2,
  EyeOff,
  MailCheck,
  ShieldAlert,
  UserCheck,
} from "lucide-react";

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
import {
  COMPANY_SIZES,
  assessCompanyVerification,
  type VerificationRoute,
} from "@/lib/company-verification";
import { COMPANY_STEPS, validateCompany } from "@/lib/sign-up-validation";
import { VERTICALS } from "@/lib/taxonomy";

const SECTOR_OPTIONS = VERTICALS.map((v) => ({ value: v.slug, label: v.name }));

const ROUTE_STYLES: Record<
  VerificationRoute,
  { icon: typeof MailCheck; label: string; panel: string; form: string }
> = {
  email: {
    icon: MailCheck,
    label: "Verify by email",
    panel: "bg-brand-accent/20 text-brand-accent",
    form: "bg-good/10 text-good",
  },
  manual: {
    icon: UserCheck,
    label: "Manual review",
    panel: "bg-white/15 text-white",
    form: "bg-brand/10 text-brand",
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
  const [sector, setSector] = useState<string | null>("hotels");
  const [size, setSize] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [hasRead, setHasRead] = useState(false);

  const assessment = size
    ? assessCompanyVerification({
        email: values.email ?? "",
        size,
        website: values.website ?? "",
      })
    : null;

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
            sector={sector}
            size={size}
            email={values.email}
            route={assessment?.route}
          />
          <PanelPoints
            points={[
              {
                icon: Building2,
                text: "One account per property — each location signs up with its own email",
              },
              {
                icon: MailCheck,
                text: "Corporate email? Confirm one link and you're verified",
              },
              {
                icon: UserCheck,
                text: "Personal email? Our team verifies you against your GSTIN or documents",
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
          <div className="grid gap-5 sm:grid-cols-2">
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
              id="sector"
              label="Sector"
              options={SECTOR_OPTIONS}
              value={sector}
              onValueChange={(v) => {
                setSector(v);
                clearError("sector");
              }}
              required
              error={errors.sector}
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
              hint="Speeds up verification."
              error={errors.gstin}
              inputClassName="uppercase placeholder:normal-case"
            />
            <Field
              id="city"
              label="Property city"
              placeholder="E.g., Kolkata"
              autoComplete="address-level2"
              required
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
          <div className="grid gap-5 sm:grid-cols-2">
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
              {assessment && !errors.email && (
                <p
                  aria-live="polite"
                  className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs leading-5 ${ROUTE_STYLES[assessment.route].form}`}
                >
                  {/* {(() => {
                    const Icon = ROUTE_STYLES[assessment.route].icon;
                    return <Icon className="mt-0.5 size-3.5 flex-none" />;
                  })()} */}
                  {assessment.reason}
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
              label={
                assessment?.route === "manual"
                  ? "Upload a business document (or add your GSTIN)"
                  : "Upload a business document"
              }
              description="Incorporation or GST certificate, or trade licence · PDF, JPG or PNG, up to 5 MB"
              required={assessment?.route === "manual" && !values.gstin}
              error={errors.proof}
            />

            <div>
              <ScrollGatedTerms
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
  sector,
  size,
  email,
  route,
}: {
  name?: string;
  property?: string;
  city?: string;
  sector: string | null;
  size: string | null;
  email?: string;
  route?: VerificationRoute;
}) {
  const companyName = name?.trim() || "Your company";
  const sectorName = VERTICALS.find((v) => v.slug === sector)?.name;
  const sizeLabel = COMPANY_SIZES.find((s) => s.value === size)?.label;
  const status = route ? ROUTE_STYLES[route] : null;
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
            {[sectorName, city?.trim()].filter(Boolean).join(" · ") ||
              "Sector · City"}
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
