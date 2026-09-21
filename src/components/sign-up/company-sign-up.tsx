"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BadgeCheck,
  EyeOff,
  MailCheck,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react";

import { registerCompany } from "@/app/(auth)/sign-up/company/actions";
import { CompanyAvatar } from "@/components/company-avatar";
import { ScrollGatedTerms } from "@/components/scroll-gated-terms";
import { Field, FieldError, FileField, SelectField } from "@/components/sign-up/fields";
import {
  PanelCard,
  PanelPoints,
  SignUpLayout,
} from "@/components/sign-up/sign-up-layout";
import {
  FormAlert,
  StepNav,
  StepPanel,
  StepProgress,
  useStepForm,
} from "@/components/sign-up/step-form";
import {
  COMPANY_SIZES,
  SEAT_PLANS,
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
  const { step, isLast, errors, values, pending, moved, goTo, formProps } = useStepForm({
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
  const plan = SEAT_PLANS.find((p) => p.value === (values.plan ?? "free"));

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
            city={values.city}
            sector={sector}
            size={size}
            planLabel={plan ? `${plan.label} · ${plan.seats}` : undefined}
            route={assessment?.route}
          />
          <PanelPoints
            points={[
              { icon: MailCheck, text: "Corporate email? Confirm one link and you're verified" },
              { icon: UserCheck, text: "Personal email? Our team verifies you against your GSTIN or documents" },
              { icon: EyeOff, text: "Candidate identity stays hidden until you unlock a profile" },
            ]}
          />
        </>
      }
    >
      <StepProgress steps={COMPANY_STEPS} current={step} onJump={goTo} />

      <form {...formProps} className="mt-10">
        <FormAlert errors={errors} />

        <StepPanel index={0} current={step} total={3} animate={moved} step={COMPANY_STEPS[0]}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="companyName" label="Registered company name" placeholder="Taj Hotels Ltd." autoComplete="organization" required error={errors.companyName} className="sm:col-span-2" />
            <SelectField id="sector" label="Sector" options={SECTOR_OPTIONS} value={sector} onValueChange={setSector} required error={errors.sector} />
            <SelectField id="size" label="Company size" options={COMPANY_SIZES} placeholder="Select size" value={size} onValueChange={setSize} required error={errors.size} />
            <Field id="website" label="Company website" placeholder="tajhotels.com" optional error={errors.website} />
            <Field id="gstin" label="GSTIN" placeholder="19AABCT1234F1Z5" optional hint="Speeds up verification." error={errors.gstin} inputClassName="uppercase placeholder:normal-case" />
            <Field id="city" label="City" placeholder="Kolkata" autoComplete="address-level2" required error={errors.city} />
            <Field id="pincode" label="Pincode" placeholder="700001" inputMode="numeric" maxLength={6} autoComplete="postal-code" required error={errors.pincode} />
          </div>
        </StepPanel>

        <StepPanel index={1} current={step} total={3} animate={moved} step={COMPANY_STEPS[1]}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="contactName" label="Full name" placeholder="Rakesh Nair" autoComplete="name" required error={errors.contactName} />
            <Field id="designation" label="Designation" placeholder="HR Manager" autoComplete="organization-title" required error={errors.designation} />
            <div className="space-y-2 sm:col-span-2">
              <Field id="email" label="Work email" type="email" placeholder="you@yourcompany.com" autoComplete="email" required error={errors.email} />
              {assessment && !errors.email && (
                <p
                  aria-live="polite"
                  className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs leading-5 ${ROUTE_STYLES[assessment.route].form}`}
                >
                  {(() => {
                    const Icon = ROUTE_STYLES[assessment.route].icon;
                    return <Icon className="mt-0.5 size-3.5 flex-none" />;
                  })()}
                  {assessment.reason}
                </p>
              )}
            </div>
            <Field id="phone" label="Mobile number" type="tel" placeholder="+91 90000 00000" autoComplete="tel" required error={errors.phone} className="sm:col-span-2" />
            <Field id="password" label="Password" type="password" placeholder="At least 8 characters" autoComplete="new-password" required error={errors.password} />
            <Field id="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" required error={errors.confirmPassword} />
          </div>
        </StepPanel>

        <StepPanel index={2} current={step} total={3} animate={moved} step={COMPANY_STEPS[2]}>
          <div className="space-y-8">
            <div>
              <p className="text-sm font-medium">
                Plan<span className="text-destructive">*</span>
              </p>
              <div
                role="radiogroup"
                aria-label="Plan"
                className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5"
              >
                {SEAT_PLANS.map((p) => (
                  <label
                    key={p.value}
                    className="group relative flex cursor-pointer flex-col rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-brand/60 hover:shadow-md has-checked:border-brand has-checked:bg-brand/5 has-checked:ring-3 has-checked:ring-brand/15 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={p.value}
                      defaultChecked={p.value === "free"}
                      className="peer sr-only"
                    />
                    <BadgeCheck className="absolute top-3 right-3 size-4 text-brand opacity-0 transition-opacity peer-checked:opacity-100" />
                    <Users className="size-4 text-muted-foreground" />
                    <span className="mt-3 font-head text-base font-extrabold tracking-tight">
                      {p.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{p.seats}</span>
                    <span className="mt-2 text-[11px] font-semibold text-brand">
                      {p.note}
                    </span>
                  </label>
                ))}
              </div>
              <FieldError message={errors.plan} />
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Paid slab pricing is confirmed by our team after verification —
                you won&apos;t be charged at sign-up. Payments are collected via
                Razorpay.
              </p>
            </div>

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
              <ScrollGatedTerms onRead={setHasRead} onAccept={setAccepted} />
              <input type="hidden" name="acceptTerms" value={accepted ? "yes" : ""} />
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
        <Link href="/sign-in" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </SignUpLayout>
  );
}

function EmployerBadge({
  name,
  city,
  sector,
  size,
  planLabel,
  route,
}: {
  name?: string;
  city?: string;
  sector: string | null;
  size: string | null;
  planLabel?: string;
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
        <CompanyAvatar name={companyName} className="size-12 rounded-2xl text-sm ring-2 ring-white/20" />
        <div className="min-w-0">
          <p className="truncate font-head text-lg font-bold">{companyName}</p>
          <p className="truncate text-xs text-white/60">
            {[sectorName, city?.trim()].filter(Boolean).join(" · ") || "Sector · City"}
          </p>
        </div>
      </div>

      <dl data-fit="7" className="mt-5 divide-y divide-white/10 rounded-2xl bg-black/15 px-4 text-sm">
        <BadgeRow label="Company size" value={sizeLabel ?? "—"} />
        <BadgeRow label="Plan" value={planLabel ?? "—"} />
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
