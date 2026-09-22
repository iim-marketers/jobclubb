"use client";

import Link from "next/link";
import { useState } from "react";
import { EyeOff, FileText, Lock, MapPin, ShieldCheck, Sparkles } from "lucide-react";

import { registerCandidate } from "@/app/(auth)/sign-up/actions";
import { ScrollGatedTerms } from "@/components/scroll-gated-terms";
import { Field, FieldError, FileField, PasswordField, SelectField } from "@/components/sign-up/fields";
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
  CANDIDATE_STEPS,
  isStudentCode,
  validateCandidate,
} from "@/lib/sign-up-validation";
import { SOURCING_CHANNELS, VERTICALS } from "@/lib/taxonomy";

const SECTOR_OPTIONS = VERTICALS.map((v) => ({ value: v.slug, label: v.name }));
const SOURCE_OPTIONS = SOURCING_CHANNELS.map((c) => ({ value: c, label: c }));

export function CandidateSignUp() {
  const { step, isLast, errors, values, pending, moved, goTo, formProps } = useStepForm({
    steps: CANDIDATE_STEPS,
    validate: validateCandidate,
    action: registerCandidate,
  });
  const [vertical, setVertical] = useState<string | null>("airlines");
  const [accepted, setAccepted] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const studentCode = isStudentCode(values.code ?? "");

  return (
    <SignUpLayout
      audience="candidate"
      eyebrow="Free to join"
      title={
        <>
          One profile. <span className="text-brand-accent">Every verified</span>{" "}
          employer.
        </>
      }
      description="Create your JobClubb profile in under two minutes. Your AI-built, ATS-ready resume is included on every plan."
      panel={
        <>
          <ProfilePreview
            firstName={values.firstName}
            lastName={values.lastName}
            city={values.city}
            vertical={vertical}
            filled={countFilled(values, vertical)}
          />
          <PanelPoints
            points={[
              { icon: FileText, text: "AI-built, ATS-approved resume on every plan" },
              { icon: MapPin, text: "Openings matched to your city and pincode" },
              { icon: ShieldCheck, text: "Your data is handled in line with the DPDP Act" },
            ]}
          />
        </>
      }
    >
      <StepProgress steps={CANDIDATE_STEPS} current={step} onJump={goTo} />

      <form {...formProps} className="mt-10">
        <FormAlert errors={errors} />

        <StepPanel index={0} current={step} total={3} animate={moved} step={CANDIDATE_STEPS[0]}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="firstName" label="First name" placeholder="Priya" autoComplete="given-name" required error={errors.firstName} />
            <Field id="lastName" label="Last name" placeholder="Sharma" autoComplete="family-name" required error={errors.lastName} />
            <Field id="email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" required error={errors.email} className="sm:col-span-2" />
            <Field id="phone" label="Mobile number" type="tel" placeholder="+91 90000 00000" autoComplete="tel" required error={errors.phone} className="sm:col-span-2" />
            <PasswordField id="password" label="Password" placeholder="At least 8 characters" required error={errors.password} />
            <PasswordField id="confirmPassword" label="Confirm password" placeholder="Re-enter password" required error={errors.confirmPassword} />
          </div>
        </StepPanel>

        <StepPanel index={1} current={step} total={3} animate={moved} step={CANDIDATE_STEPS[1]}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="city" label="City" placeholder="Kolkata" autoComplete="address-level2" required error={errors.city} />
            <Field id="pincode" label="Pincode" placeholder="700001" inputMode="numeric" maxLength={6} autoComplete="postal-code" required error={errors.pincode} />
            <SelectField
              id="vertical"
              label="Preferred sector"
              options={SECTOR_OPTIONS}
              value={vertical}
              onValueChange={setVertical}
              required
              error={errors.vertical}
              className="sm:col-span-2"
            />
          </div>
        </StepPanel>

        <StepPanel index={2} current={step} total={3} animate={moved} step={CANDIDATE_STEPS[2]}>
          <div className="space-y-5">
            <SelectField
              id="source"
              label="How did you hear about JobClubb?"
              options={SOURCE_OPTIONS}
              placeholder="Select an option"
              required
              error={errors.source}
            />
            <Field
              id="code"
              label="Franchise, student or referral code"
              placeholder="JC-STU-7F2A"
              optional
              hint="Have a code from a franchise partner, your college or a friend? Add it here."
              error={errors.code}
              inputClassName="uppercase placeholder:normal-case"
            />
            {studentCode && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none">
                <FileField
                  id="studentId"
                  label="Upload your student ID"
                  description="Needed for student codes · PDF, JPG or PNG, up to 5 MB"
                  required
                  error={errors.studentId}
                />
              </div>
            )}

            <div className="pt-2">
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
          submitLabel="Create my account"
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
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </SignUpLayout>
  );
}

const PREVIEW_FIELDS = ["firstName", "lastName", "email", "phone", "city", "pincode"];

function countFilled(values: Record<string, string>, vertical: string | null) {
  const filled = PREVIEW_FIELDS.filter((f) => values[f]?.trim()).length;
  return (filled + (vertical ? 1 : 0)) / (PREVIEW_FIELDS.length + 1);
}

// SOP §4.2: employers only ever see skills and experience — this card shows the
// candidate exactly that, with their own name blurred out as they type it.
function ProfilePreview({
  firstName,
  lastName,
  city,
  vertical,
  filled,
}: {
  firstName?: string;
  lastName?: string;
  city?: string;
  vertical: string | null;
  filled: number;
}) {
  const name = [firstName, lastName].filter((s) => s?.trim()).join(" ");
  const sector = VERTICALS.find((v) => v.slug === vertical);

  return (
    <PanelCard
      label="What employers see"
      badge={
        <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
          <EyeOff className="size-3" />
          Identity hidden
        </span>
      }
    >
      <div className="flex items-center gap-3.5">
        <span className="relative flex size-12 flex-none items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-brand-accent/60 to-white/20">
          <span className="font-head text-lg font-extrabold blur-[5px]">
            {(firstName?.[0] ?? "J") + (lastName?.[0] ?? "C")}
          </span>
          <Lock className="absolute size-4 text-white/90" />
        </span>
        <div className="min-w-0">
          <p
            aria-hidden
            className="truncate font-head text-lg font-bold blur-[6px] select-none"
          >
            {name || "Your full name"}
          </p>
          <p className="mt-0.5 font-mono text-xs text-white/60">CAND-••••</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip>{sector?.name ?? "Your sector"}</Chip>
        <Chip>
          <MapPin className="size-3" />
          {city?.trim() || "Your city"}
        </Chip>
      </div>

      <div data-fit="7" className="mt-5 rounded-2xl bg-black/15 p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
          <Sparkles className="size-3.5 text-brand-accent" />
          Skills &amp; experience
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(sector?.roles.slice(0, 3) ?? ["Skill", "Skill", "Skill"]).map((r, i) => (
            <span
              key={`${r}-${i}`}
              className="rounded-full border border-dashed border-white/25 px-2.5 py-1 text-[11px] text-white/60"
            >
              {r}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-4 text-white/50">
          Filled in from your AI-built resume after sign-up.
        </p>
      </div>

      <div data-fit="8" className="mt-5">
        <div className="flex items-center justify-between text-[11px] text-white/60">
          <span>Profile basics</span>
          <span className="font-head font-bold text-white">{Math.round(filled * 100)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-brand-accent transition-[width] duration-500 ease-out"
            style={{ width: `${filled * 100}%` }}
          />
        </div>
      </div>
    </PanelCard>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 text-xs font-medium text-white/90">
      {children}
    </span>
  );
}
