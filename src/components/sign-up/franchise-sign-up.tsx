"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BadgeIndianRupee,
  ClipboardCheck,
  MailCheck,
  Store,
} from "lucide-react";

import { registerFranchise } from "@/app/(auth)/sign-up/franchise/actions";
import {
  Field,
  FieldError,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONSTITUTIONS, FRANCHISE_SIGN_UP_STEPS } from "@/lib/franchise";
// import { validateFranchiseSignUp } from "@/lib/franchise";

const STEPS = FRANCHISE_SIGN_UP_STEPS;

function AddressField({
  id,
  label,
  error,
}: {
  id: string;
  label: string;
  error?: string;
}) {
  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor={id}>
        {label}
        <span className="text-destructive">*</span>
      </Label>
      <Textarea
        id={id}
        name={id}
        rows={2}
        maxLength={300}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="max-h-40 overflow-y-auto bg-card"
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function FranchiseSignUp() {
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
    steps: STEPS,
    // validate: validateFranchiseSignUp,
    validate: () => ({}),
    action: registerFranchise,
  });
  const [constitution, setConstitution] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  return (
    <SignUpLayout
      audience="franchise"
      eyebrow="For franchise partners"
      title={
        <>
          Run a <span className="text-brand-accent">JobClubb outlet</span> in
          your city.
        </>
      }
      description="Register candidates at your outlet and earn half of every registration and placement fee they pay. Sign up, and we'll get in touch about the franchise agreement."
      panel={
        <>
          <PanelCard label="Your outlet">
            <p className="font-head text-lg font-bold">
              {values.name?.trim() || "Your outlet name"}
            </p>
            <p className="mt-0.5 text-sm text-white/65">
              {[values.city?.trim(), values.pincode?.trim()]
                .filter(Boolean)
                .join(", ") || "City, pincode"}
            </p>
            <div
              data-fit="7"
              className="mt-4 grid grid-cols-2 gap-2 text-center"
            >
              <div className="rounded-2xl bg-black/15 px-3 py-3">
                <p className="font-head text-xl font-extrabold">₹749.50</p>
                <p className="text-[11px] text-white/60">
                  per paid registration
                </p>
              </div>
              <div className="rounded-2xl bg-black/15 px-3 py-3">
                <p className="font-head text-xl font-extrabold">50%</p>
                <p className="text-[11px] text-white/60">
                  of each placement fee
                </p>
              </div>
            </div>
          </PanelCard>
          <PanelPoints
            points={[
              {
                icon: MailCheck,
                text: "Confirm your email, then we review your application",
              },
              // {
              //   icon: ClipboardCheck,
              //   text: "Sign the franchise agreement and pay the ₹3,00,000 + GST franchise fee",
              // },
              {
                icon: Store,
                text: "Get your franchise code and dashboard once approved",
              },
              // {
              //   icon: BadgeIndianRupee,
              //   text: "Commission paid within two working days of each payment",
              // },
            ]}
          />
        </>
      }
    >
      <StepProgress steps={STEPS} current={step} onJump={goTo} />

      <form {...formProps} className="mt-10">
        <StepPanel
          index={0}
          current={step}
          total={STEPS.length}
          animate={moved}
          step={STEPS[0]}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="legalName"
              label="Legal name"
              placeholder="E.g., Sharma Placements LLP"
              hint="Your own name if you're signing as an individual."
              autoComplete="organization"
              required
              error={errors.legalName}
              className="sm:col-span-2"
            />
            <SelectField
              id="constitution"
              label="Business type"
              placeholder="Choose one"
              options={CONSTITUTIONS}
              value={constitution}
              onValueChange={(v) => {
                setConstitution(v);
                clearError("constitution");
              }}
              required
              error={errors.constitution}
              className="sm:col-span-2"
            />
            <Field
              id="pan"
              label="PAN"
              placeholder="E.g., ABCDE1234F"
              maxLength={10}
              required
              error={errors.pan}
              inputClassName="uppercase placeholder:normal-case"
            />
            <Field
              id="gstin"
              label="GSTIN"
              placeholder="E.g., 19AABCT1234F1Z5"
              maxLength={15}
              optional
              error={errors.gstin}
              inputClassName="uppercase placeholder:normal-case"
            />
            <AddressField
              id="registeredAddress"
              label="Registered or residential address"
              error={errors.registeredAddress}
            />
          </div>
        </StepPanel>

        <StepPanel
          index={1}
          current={step}
          total={STEPS.length}
          animate={moved}
          step={STEPS[1]}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="name"
              label="Outlet name"
              placeholder="E.g., Sharma Placements, Salt Lake"
              hint="How your outlet appears on your dashboard."
              maxLength={80}
              required
              error={errors.name}
              className="sm:col-span-2"
            />
            <AddressField
              id="outletAddress"
              label="Outlet address"
              error={errors.outletAddress}
            />
            <Field
              id="city"
              label="City"
              placeholder="E.g., Kolkata"
              autoComplete="address-level2"
              maxLength={80}
              required
              error={errors.city}
            />
            <Field
              id="pincode"
              label="Pincode"
              placeholder="E.g., 700091"
              inputMode="numeric"
              maxLength={6}
              autoComplete="postal-code"
              required
              error={errors.pincode}
            />
            <Field
              id="areaSqft"
              label="Outlet area (sq ft)"
              placeholder="E.g., 300"
              inputMode="numeric"
              maxLength={6}
              required
              hint="At least 200 sq ft. Up to 500 sq ft unless JobClubb agrees otherwise."
              error={errors.areaSqft}
              className="sm:col-span-2"
            />
          </div>
        </StepPanel>

        <StepPanel
          index={2}
          current={step}
          total={STEPS.length}
          animate={moved}
          step={STEPS[2]}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="bankAccountName"
              label="Account name"
              placeholder="E.g., Sharma Placements LLP"
              maxLength={120}
              error={errors.bankAccountName}
            />
            <Field
              id="bankName"
              label="Bank and branch"
              placeholder="E.g., State Bank of India"
              maxLength={120}
              error={errors.bankName}
            />
            <Field
              id="bankAccountNo"
              label="Account number"
              inputMode="numeric"
              placeholder="E.g., 123456789012"
              maxLength={18}
              error={errors.bankAccountNo}
            />
            <Field
              id="bankIfsc"
              label="IFSC"
              placeholder="E.g., SBIN0001234"
              maxLength={11}
              error={errors.bankIfsc}
              inputClassName="uppercase placeholder:normal-case"
            />
          </div>
        </StepPanel>

        <StepPanel
          index={3}
          current={step}
          total={STEPS.length}
          animate={moved}
          step={STEPS[3]}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="ownerName"
              label="Your full name"
              placeholder="E.g., Anita Sharma"
              autoComplete="name"
              maxLength={80}
              required
              error={errors.ownerName}
            />
            <Field
              id="phone"
              label="Mobile number"
              type="tel"
              placeholder="E.g., 9000000000"
              autoComplete="tel"
              required
              error={errors.phone}
            />
            <Field
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              hint="You'll sign in with this. We'll send a link to confirm it."
              autoComplete="email"
              required
              error={errors.email}
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
              placeholder="Re-enter password"
              required
              error={errors.confirmPassword}
            />
            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <Checkbox
                  checked={accepted}
                  onCheckedChange={(checked) => {
                    setAccepted(checked);
                    clearError("acceptTerms");
                  }}
                  className="mt-0.5"
                />
                <span className="leading-6 text-muted-foreground">
                  These details are correct, and I agree to JobClubb&apos;s{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-medium text-foreground underline underline-offset-2"
                  >
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-medium text-foreground underline underline-offset-2"
                  >
                    Privacy Policy
                  </Link>
                  . I understand my franchise starts only once JobClubb approves
                  it, after the franchise agreement is signed and the one-time
                  franchise fee of ₹3,00,000 + GST is paid.
                </span>
              </label>
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
          submitLabel="Sign up as a franchise"
          submitDisabled={!accepted}
          hint={accepted ? undefined : "Tick the box above to continue."}
          onBack={() => goTo(step - 1)}
        />
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already a franchise partner?{" "}
        <Link
          href="/sign-in?as=franchise"
          className="font-semibold text-brand hover:underline"
        >
          Sign in
        </Link>
      </p>
    </SignUpLayout>
  );
}
