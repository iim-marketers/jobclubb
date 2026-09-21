"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  BadgeIndianRupee,
  Check,
  MailCheck,
  MapPin,
  Percent,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

import { registerFranchise } from "@/app/(auth)/sign-up/franchise/actions";
import { ScrollGatedTerms } from "@/components/scroll-gated-terms";
import { Field, FieldError, SelectField } from "@/components/sign-up/fields";
import {
  FormAlert,
  StepNav,
  StepPanel,
  useStepForm,
} from "@/components/sign-up/step-form";
import {
  BUSINESS_TYPES,
  FRANCHISE_EMAIL_DOMAIN,
  FRANCHISE_STEPS,
  isFranchiseEmail,
  validateFranchise,
} from "@/lib/sign-up-validation";

export function FranchiseSignUp() {
  const { step, isLast, errors, values, pending, moved, goTo, formProps } =
    useStepForm({
      steps: FRANCHISE_STEPS,
      validate: validateFranchise,
      action: registerFranchise,
    });
  const [accepted, setAccepted] = useState(false);
  const [hasRead, setHasRead] = useState(false);

  const email = values.email?.trim() ?? "";
  const emailOk = isFranchiseEmail(email);

  return (
    <div className="flex-1">
      <section className="jc-auth-panel relative isolate overflow-hidden px-4 pt-7 pb-28 text-white sm:px-6 sm:pt-10 sm:pb-36 lg:pt-14 lg:pb-44">
        <div className="mx-auto grid max-w-6xl items-center gap-6 sm:gap-10 lg:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <p className="font-head text-xs font-bold tracking-[0.14em] text-brand-accent uppercase">
              Franchise partner onboarding
            </p>
            <h1 className="mt-2 font-head text-[1.75rem] leading-[1.1] sm:mt-3 sm:text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
              Set up your <span className="text-brand-accent">franchise</span>{" "}
              on JobClubb.
            </h1>
            <p className="mt-4 hidden max-w-xl leading-7 text-white/70 sm:block">
              Activate your franchise account with the email ID head office
              issued to you. Once you&apos;re live, you&apos;ll add leads and
              track every one from sent to placed.
            </p>

            <ul className="jc-hscroll -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:mt-7 sm:flex-wrap sm:gap-2.5 sm:overflow-visible sm:px-0">
              {[
                { icon: TrendingUp, text: "Leads sent → placed tracking" },
                { icon: BadgeIndianRupee, text: "₹1,199 lead registration" },
                { icon: Percent, text: "50% placement profit share" },
              ].map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex flex-none items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs whitespace-nowrap text-white/85 ring-1 ring-white/15 sm:px-3.5 sm:py-2 sm:text-sm"
                >
                  <Icon className="size-4 text-brand-accent" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <PartnerCard
            franchiseName={values.franchiseName}
            city={values.city}
            pincode={values.pincode}
            email={email}
            emailOk={emailOk}
          />
        </div>
      </section>

      <div className="relative -mt-20 px-3 pb-10 sm:-mt-24 sm:px-6 sm:pb-16 lg:-mt-32">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl sm:rounded-3xl shadow-brand-surface-strong/10 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-border bg-muted/40 px-4 py-4 sm:p-6 lg:border-r lg:border-b-0 lg:p-8">
            <VerticalSteps current={step} onJump={goTo} />

            <div className="mt-8 hidden rounded-2xl border border-border bg-card p-4 lg:block">
              <p className="font-head text-sm font-bold">
                No franchise email ID yet?
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Email IDs are issued by head office once your franchise
                application is approved.
              </p>
              <Link
                href="/franchise"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                About the franchise program
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </aside>

          <div className="px-4 py-6 sm:p-8 lg:p-10">
            <form {...formProps}>
              <FormAlert errors={errors} />

              <StepPanel
                index={0}
                current={step}
                total={3}
                animate={moved}
                step={FRANCHISE_STEPS[0]}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Field
                      id="email"
                      label="Franchise email ID"
                      type="email"
                      placeholder={`yourcity@${FRANCHISE_EMAIL_DOMAIN}`}
                      autoComplete="email"
                      required
                      error={errors.email}
                    />
                    {email.includes("@") && !errors.email && (
                      <p
                        aria-live="polite"
                        className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs leading-5 ${
                          emailOk
                            ? "bg-good/10 text-good"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {emailOk ? (
                          <MailCheck className="mt-0.5 size-3.5 flex-none" />
                        ) : (
                          <ShieldAlert className="mt-0.5 size-3.5 flex-none" />
                        )}
                        {emailOk
                          ? "Franchise email ID recognised — we'll send your activation link here."
                          : `Franchise accounts use the @${FRANCHISE_EMAIL_DOMAIN} email ID issued by head office, not a personal address.`}
                      </p>
                    )}
                  </div>
                  <Field
                    id="franchiseName"
                    label="Franchise name"
                    placeholder="Kolkata South"
                    required
                    error={errors.franchiseName}
                    className="sm:col-span-2"
                  />
                  <Field
                    id="city"
                    label="Territory city"
                    placeholder="Kolkata"
                    autoComplete="address-level2"
                    required
                    error={errors.city}
                  />
                  <Field
                    id="pincode"
                    label="Pincode"
                    placeholder="700029"
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
                step={FRANCHISE_STEPS[1]}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="businessName"
                    label="Registered business name"
                    placeholder="Sen Placements Pvt. Ltd."
                    autoComplete="organization"
                    required
                    error={errors.businessName}
                    className="sm:col-span-2"
                  />
                  <SelectField
                    id="businessType"
                    label="Business type"
                    options={BUSINESS_TYPES}
                    placeholder="Select type"
                    required
                    error={errors.businessType}
                    className="sm:col-span-2"
                  />
                  <Field
                    id="pan"
                    label="PAN"
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    required
                    hint="Needed for profit-share payouts."
                    error={errors.pan}
                    inputClassName="uppercase placeholder:normal-case"
                  />
                  <Field
                    id="gstin"
                    label="GSTIN"
                    placeholder="19AABCT1234F1Z5"
                    maxLength={15}
                    optional
                    error={errors.gstin}
                    inputClassName="uppercase placeholder:normal-case"
                  />
                  <Field
                    id="address"
                    label="Office address"
                    placeholder="12 Rashbehari Avenue, Kolkata"
                    autoComplete="street-address"
                    required
                    error={errors.address}
                    className="sm:col-span-2"
                  />
                </div>
              </StepPanel>

              <StepPanel
                index={2}
                current={step}
                total={3}
                animate={moved}
                step={FRANCHISE_STEPS[2]}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="ownerName"
                    label="Owner's full name"
                    placeholder="Arijit Sen"
                    autoComplete="name"
                    required
                    error={errors.ownerName}
                  />
                  <Field
                    id="phone"
                    label="Mobile number"
                    type="tel"
                    placeholder="+91 90000 00000"
                    autoComplete="tel"
                    required
                    error={errors.phone}
                  />
                  <Field
                    id="password"
                    label="Password"
                    type="password"
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                    error={errors.password}
                  />
                  <Field
                    id="confirmPassword"
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    required
                    error={errors.confirmPassword}
                  />
                  <div className="sm:col-span-2">
                    <ScrollGatedTerms
                      onRead={setHasRead}
                      onAccept={setAccepted}
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
                submitLabel="Activate franchise"
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

            <div className="mt-8 flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
              <p>
                Already activated?{" "}
                <Link
                  href="/sign-in?as=franchise"
                  className="font-semibold text-brand hover:underline"
                >
                  Sign in
                </Link>
              </p>
              <p className="lg:hidden">
                No franchise email ID yet?{" "}
                <Link
                  href="/franchise"
                  className="font-semibold text-brand hover:underline"
                >
                  About the program
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerticalSteps({
  current,
  onJump,
}: {
  current: number;
  onJump: (index: number) => void;
}) {
  const last = FRANCHISE_STEPS.length - 1;
  return (
    <>
      {/* Phones & tablets: a compact connected row, naming the current step. */}
      <ol className="flex items-center lg:hidden">
        {FRANCHISE_STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li
              key={s.title}
              className={`flex min-w-0 items-center ${i < last ? "flex-1" : ""}`}
            >
              <button
                type="button"
                disabled={!done}
                onClick={() => onJump(i)}
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${i + 1}: ${s.title}`}
                className="flex min-w-0 items-center gap-2 disabled:cursor-default"
              >
                <StepDot index={i} done={done} active={active} />
                {/* Phones show just the dots — the step title is right below. */}
                <span
                  className={`hidden truncate font-head text-xs font-bold sm:inline ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.title}
                </span>
              </button>
              {i < last && (
                <span
                  aria-hidden
                  className={`mx-2 h-0.5 min-w-4 flex-1 rounded-full transition-colors duration-500 ${
                    done ? "bg-brand" : "bg-border"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Desktop: a vertical timeline down the side of the form. */}
      <ol className="hidden lg:block">
        {FRANCHISE_STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.title} className="relative pb-8 last:pb-0">
              {i < last && (
                <span
                  aria-hidden
                  className={`absolute top-9 bottom-1 left-[15px] w-0.5 rounded-full transition-colors duration-500 ${
                    done ? "bg-brand" : "bg-border"
                  }`}
                />
              )}
              <button
                type="button"
                disabled={!done}
                onClick={() => onJump(i)}
                aria-current={active ? "step" : undefined}
                className="group flex w-full items-start gap-3 text-left disabled:cursor-default"
              >
                <StepDot index={i} done={done} active={active} />
                <span className="min-w-0 pt-1">
                  <span
                    className={`block truncate font-head text-sm font-bold ${
                      active ? "text-foreground" : "text-muted-foreground"
                    } ${done ? "group-hover:text-brand" : ""}`}
                  >
                    {s.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    {done ? "Done" : active ? "In progress" : "Up next"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function StepDot({
  index,
  done,
  active,
}: {
  index: number;
  done: boolean;
  active: boolean;
}) {
  return (
    <span
      className={`flex size-8 flex-none items-center justify-center rounded-full font-head text-sm font-bold transition-all duration-300 ${
        done
          ? "bg-brand text-brand-foreground"
          : active
            ? "bg-brand-surface-strong text-white ring-4 ring-brand/15"
            : "border border-border bg-card text-muted-foreground"
      }`}
    >
      {done ? <Check className="size-4" strokeWidth={3} /> : index + 1}
    </span>
  );
}

// A live partner ID card that fills in as the franchise details are typed.
// The franchise code (SOP §3.1 lead attribution) is only issued on activation,
// so its tail stays masked here.
function PartnerCard({
  franchiseName,
  city,
  pincode,
  email,
  emailOk,
}: {
  franchiseName?: string;
  city?: string;
  pincode?: string;
  email: string;
  emailOk: boolean;
}) {
  const cityCode = (
    city?.replace(/[^a-z]/gi, "").slice(0, 3) || "···"
  ).toUpperCase();

  return (
    <div className="relative w-full max-w-[20rem] sm:max-w-sm lg:w-[360px]">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2rem] bg-brand-accent/20 blur-3xl"
      />
      <div className="relative overflow-hidden sm:aspect-[1.586] rounded-2xl bg-linear-to-br from-white/20 via-white/10 to-white/5 p-4 shadow-2xl sm:rounded-3xl sm:p-5 ring-1 ring-white/25 backdrop-blur-xl sm:p-6 lg:rotate-2 lg:transition-transform lg:duration-500 lg:hover:rotate-0">
        <div
          aria-hidden
          className="absolute -top-20 -right-16 size-56 rounded-full bg-brand-accent/30 blur-2xl"
        />
        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-head text-[10px] font-bold tracking-[0.18em] text-white/60 uppercase">
                JobClubb partner
              </p>
              <p className="mt-1.5 max-w-[12rem] truncate font-head text-lg font-extrabold tracking-tight sm:max-w-[14rem] sm:text-xl">
                {franchiseName?.trim() || "Your franchise"}
              </p>
            </div>
            <span
              className={`flex-none rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${
                emailOk
                  ? "bg-brand-accent text-brand-surface-strong"
                  : "bg-white/15 text-white/70"
              }`}
            >
              {emailOk ? "Ready to activate" : "Pending"}
            </span>
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-xs text-white/70">
            <MapPin className="size-3.5" />
            {[city?.trim(), pincode?.trim()].filter(Boolean).join(" · ") ||
              "Territory"}
          </p>

          <div className="mt-4 sm:mt-auto">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-white/50 uppercase">
              Franchise code
            </p>
            <p className="mt-1 font-mono text-base font-bold tracking-[0.12em] sm:text-xl">
              JC-FR-{cityCode}-<span className="text-white/40">••••</span>
            </p>
            <p className="mt-2 truncate font-mono text-[11px] text-white/60">
              {email || `yourcity@${FRANCHISE_EMAIL_DOMAIN}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
