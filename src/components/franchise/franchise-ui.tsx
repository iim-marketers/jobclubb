"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import {
  useActionState,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import { createColumnHelper } from "@tanstack/react-table";
import {
  BadgeIndianRupee,
  CircleCheck,
  KeyRound,
  Loader2,
  LockKeyhole,
  MailCheck,
  MapPin,
  ShieldCheck,
  TriangleAlert,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  addBankDetails,
  discardRegistration,
  resendCandidateCode,
  setCandidatePassword,
  startCandidateRegistration,
  verifyCandidateCode,
  type PasswordState,
  type RegistrationState,
  type VerifyState,
} from "@/app/(app)/franchise/dashboard/actions";
import {
  adminTableFeatures,
  DataTable,
  formatDate,
  industryName,
} from "@/components/admin/data-table";
import type { SettingsActionState } from "@/app/(app)/candidate/dashboard/settings/actions";
import { Panel } from "@/components/candidate/dashboard-ui";
import {
  FormStatus,
  SubmitButton,
  submitManually,
} from "@/components/candidate/settings-forms";
import { RazorpayCheckout } from "@/components/razorpay-checkout";
import {
  Field,
  FieldError,
  PasswordField,
  SelectField,
  useFieldErrors,
} from "@/components/sign-up/fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FRANCHISE_CANDIDATES,
  OTP_LENGTH,
  OTP_TTL_MINUTES,
} from "@/lib/franchise";
import { CHECKOUT_PLAN, PLAN_DETAILS } from "@/lib/membership";
import { formatRupees, type PlacementStatus } from "@/lib/placements";
import { INDUSTRIES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import type { FranchiseCandidate } from "@/server/franchises/franchises";
import type { RegisteredCandidate } from "@/server/franchises/registration";

const INDUSTRY_OPTIONS = INDUSTRIES.map((i) => ({
  value: i.slug,
  label: i.name,
}));
const RESEND_COOLDOWN_SECONDS = 60;

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-head font-bold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function RegisterCandidateForm({
  franchiseName,
}: {
  franchiseName: string;
}) {
  const [state, formAction, pending] = useActionState<
    RegistrationState,
    FormData
  >(startCandidateRegistration, {});
  const { errors, formError, clear, clearAll, onChange } = useFieldErrors(
    state,
    state.errors,
    state.error,
  );
  const [industry, setIndustry] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [restartError, setRestartError] = useState<string | null>(null);
  const [verified, setVerified] = useState<string | null>(null);
  const [registered, setRegistered] = useState<RegisteredCandidate | null>(
    null,
  );
  const [paid, setPaid] = useState(false);
  const [leaving, setLeaving] = useState<LeaveNav | null>(null);
  const [instance, setInstance] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const hasErrors = Object.keys(errors).length > 0;

  const pendingRegistration =
    state.pending && state.pending.registrationId !== dismissed
      ? state.pending
      : null;

  const guard: { target: DiscardTarget; name: string } | null = registered
    ? paid
      ? null
      : { target: { candidateId: registered.id }, name: registered.name }
    : pendingRegistration
      ? {
          target: { registrationId: pendingRegistration.registrationId },
          name: pendingRegistration.name,
        }
      : null;
  const releaseGuard = useLeaveGuard(!!guard, setLeaving);

  const reset = () => {
    setRegistered(null);
    setPaid(false);
    setVerified(null);
    setRestartError(null);
    setDismissed(state.pending?.registrationId ?? null);
    setIndustry(null);
    setConsent(false);
    setInstance((n) => n + 1);
  };

  const guardUi = guard && (
    <LeaveDialog
      nav={leaving}
      target={guard.target}
      name={guard.name}
      onCancel={() => setLeaving(null)}
      onDiscarded={releaseGuard}
    />
  );

  if (registered)
    return (
      <div className="space-y-4">
        {guardUi}
        <PaymentStep
          candidate={registered}
          paid={paid}
          onPaid={() => setPaid(true)}
          onRegisterAnother={reset}
        />
      </div>
    );

  const restart = (registrationId: string, message: string) => {
    setDismissed(registrationId);
    setRestartError(message);
  };

  return (
    <div className="space-y-4">
      {guardUi}
      {pendingRegistration &&
        (verified === pendingRegistration.registrationId ? (
          <SetPassword
            key={pendingRegistration.registrationId}
            registrationId={pendingRegistration.registrationId}
            email={pendingRegistration.email}
            name={pendingRegistration.name}
            onRestart={(message) =>
              restart(pendingRegistration.registrationId, message)
            }
            onRegistered={setRegistered}
          />
        ) : (
          <VerifyCode
            key={pendingRegistration.registrationId}
            registrationId={pendingRegistration.registrationId}
            email={pendingRegistration.email}
            name={pendingRegistration.name}
            onRestart={(message) =>
              restart(pendingRegistration.registrationId, message)
            }
            onVerified={() => setVerified(pendingRegistration.registrationId)}
          />
        ))}

      <form
        key={instance}
        ref={formRef}
        hidden={!!pendingRegistration}
        onSubmit={(e) => {
          clearAll();
          setRestartError(null);
          submitManually(formAction)(e);
        }}
        onChange={onChange}
        noValidate
        className="space-y-6"
      >
        <Section
          icon={UserRound}
          title="About the candidate"
          description="We'll email them a 6-digit code to confirm the email is theirs. Make sure they can open their inbox now."
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="firstName"
              label="First name"
              placeholder="e.g. Priya"
              autoComplete="off"
              required
              maxLength={80}
              error={errors.firstName}
            />
            <Field
              id="lastName"
              label="Last name"
              placeholder="e.g. Sharma"
              autoComplete="off"
              required
              maxLength={80}
              error={errors.lastName}
            />
            <Field
              id="email"
              label="Candidate's email"
              type="email"
              placeholder="their@email.com"
              autoComplete="off"
              required
              error={errors.email}
            />
            <Field
              id="phone"
              label="Mobile number"
              type="tel"
              placeholder="e.g. 7987654321"
              autoComplete="off"
              required
              error={errors.phone}
            />
          </div>
        </Section>

        <Section
          icon={MapPin}
          title="Their preferences"
          description="Used to match them with openings near them."
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="city"
              label="City"
              placeholder="e.g. Kolkata"
              autoComplete="off"
              required
              maxLength={80}
              error={errors.city}
            />
            <Field
              id="pincode"
              label="Pincode"
              placeholder="e.g. 700001"
              inputMode="numeric"
              maxLength={6}
              autoComplete="off"
              required
              error={errors.pincode}
            />
            <SelectField
              id="industry"
              label="Preferred industry"
              placeholder="Choose an industry"
              options={INDUSTRY_OPTIONS}
              value={industry}
              onValueChange={(v) => {
                setIndustry(v);
                clear("industry");
              }}
              required
              error={errors.industry}
              className="sm:col-span-2"
            />
          </div>
        </Section>

        <Section
          icon={ShieldCheck}
          title="Consent"
          description="Clause 8.4 of your agreement: tell the candidate why we collect their details before you submit them."
        >
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <Checkbox
              checked={consent}
              onCheckedChange={(checked) => {
                setConsent(checked);
                clear("consent");
              }}
              className="mt-0.5"
            />
            <span className="leading-6">
              The candidate is with me and agrees to share these details with{" "}
              {franchiseName} and JobClubb to register and find a job.
            </span>
          </label>
          <input type="hidden" name="consent" value={consent ? "yes" : ""} />
          <FieldError message={errors.consent} />
        </Section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FormStatus
            error={
              restartError ??
              formError ??
              (hasErrors
                ? "Fix the highlighted fields and try again."
                : undefined)
            }
          />
          <SubmitButton pending={pending} disabled={pending || !consent}>
            {pending ? "Sending code..." : "Send code to candidate"}
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}

function VerifyCode({
  registrationId,
  email,
  name,
  onRestart,
  onVerified,
}: {
  registrationId: string;
  email: string;
  name: string;
  onRestart: (message: string) => void;
  onVerified: () => void;
}) {
  const [state, formAction, pending] = useActionState<VerifyState, FormData>(
    verifyCandidateCode.bind(null, registrationId),
    {},
  );
  const { formError, clearAll, onChange } = useFieldErrors(
    state,
    {},
    state.error,
  );
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, startResend] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const autoSubmitted = useRef("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (state.verified) onVerified();
    else if (state.restart && state.error) onRestart(state.error);
    else if (state.error) inputRef.current?.select();
  }, [state, onVerified, onRestart]);

  useEffect(() => inputRef.current?.focus(), []);

  useEffect(() => {
    if (code.length !== OTP_LENGTH || pending || autoSubmitted.current === code)
      return;
    autoSubmitted.current = code;
    formRef.current?.requestSubmit();
  }, [code, pending]);

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-8 ring-brand/5">
          <MailCheck className="size-6" />
        </span>
        <h2 className="mt-5 font-head text-xl font-extrabold tracking-tight">
          Check {name}&apos;s inbox
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          Enter the {OTP_LENGTH}-digit code we sent to
        </p>
        <p className="mt-1 max-w-full rounded-full bg-muted px-3 py-1 text-sm font-semibold break-all text-foreground">
          {email}
        </p>

        <form
          ref={formRef}
          onSubmit={(e) => {
            clearAll();
            submitManually(formAction)(e);
          }}
          onChange={onChange}
          noValidate
          className="mt-7 w-full"
        >
          <OtpInput
            inputRef={inputRef}
            value={code}
            onValueChange={setCode}
            invalid={!!formError}
            disabled={pending}
          />
          <div className="mt-3 flex justify-center text-center">
            <FormStatus error={formError} />
          </div>
          <Button
            type="submit"
            disabled={pending || code.length < OTP_LENGTH}
            className="mt-2 h-11 w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? "Verifying..." : "Verify email"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-muted-foreground">
          Didn&apos;t get it?{" "}
          {cooldown > 0 ? (
            <span className="font-medium tabular-nums">
              Resend in 0:{String(cooldown).padStart(2, "0")}
            </span>
          ) : (
            <button
              type="button"
              disabled={resending || pending}
              onClick={() =>
                startResend(async () => {
                  const result = await resendCandidateCode(registrationId);
                  if (result.restart && result.error)
                    return onRestart(result.error);
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("New code sent");
                  setCode("");
                  autoSubmitted.current = "";
                  setCooldown(RESEND_COOLDOWN_SECONDS);
                  inputRef.current?.focus();
                })
              }
              className="inline-flex items-center gap-1 font-head font-semibold text-brand underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-60"
            >
              {resending && <Loader2 className="size-3.5 animate-spin" />}
              Resend code
            </button>
          )}
        </p>

        <p className="mt-6 w-full border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
          The code expires in {OTP_TTL_MINUTES} minutes. If it hasn&apos;t
          arrived, ask {name} to check their spam folder.
        </p>
        <StayNotice hasAccount={false} />
      </div>
    </section>
  );
}

function SetPassword({
  registrationId,
  email,
  name,
  onRestart,
  onRegistered,
}: {
  registrationId: string;
  email: string;
  name: string;
  onRestart: (message: string) => void;
  onRegistered: (candidate: RegisteredCandidate) => void;
}) {
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(
    setCandidatePassword.bind(null, registrationId),
    {},
  );
  const { errors, formError, clearAll, onChange } = useFieldErrors(
    state,
    state.errors,
    state.error,
  );

  useEffect(() => {
    if (state.registered) onRegistered(state.registered);
    else if (state.restart && state.error) onRestart(state.error);
  }, [state, onRegistered, onRestart]);

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-8 ring-brand/5">
          <KeyRound className="size-6" />
        </span>
        <h2 className="mt-5 font-head text-xl font-extrabold tracking-tight">
          Choose a password for {name}
        </h2>
        {/* <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          Their email is confirmed.
        </p> */}

        <form
          onSubmit={(e) => {
            clearAll();
            submitManually(formAction)(e);
          }}
          onChange={onChange}
          noValidate
          className="mt-7 w-full space-y-5 text-left"
        >
          <PasswordField
            id="password"
            label="Password"
            hint="At least 8 characters."
            placeholder="••••••••"
            autoComplete="off"
            error={errors.password}
          />
          <PasswordField
            id="confirmPassword"
            label="Confirm password"
            placeholder="••••••••"
            autoComplete="off"
            error={errors.confirmPassword}
          />
          {/* <div className="flex justify-center text-center">
            <FormStatus error={formError} />
          </div> */}
          <Button
            type="submit"
            disabled={pending}
            className="h-11 w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <StayNotice hasAccount={false} />
      </div>
    </section>
  );
}

function PaymentStep({
  candidate,
  paid,
  onPaid,
  onRegisterAnother,
}: {
  candidate: RegisteredCandidate;
  paid: boolean;
  onPaid: () => void;
  onRegisterAnother: () => void;
}) {
  const firstName = candidate.name.split(" ")[0];

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-10">
      <div className="text-center">
        <span
          className={cn(
            "mx-auto flex size-12 items-center justify-center rounded-full",
            paid ? "bg-good/12 text-good" : "bg-brand/10 text-brand",
          )}
        >
          {paid ? (
            <CircleCheck className="size-6" />
          ) : (
            <BadgeIndianRupee className="size-6" />
          )}
        </span>
        <h2 className="mt-4 font-head text-xl font-extrabold tracking-tight">
          {paid
            ? `${candidate.name} is a JobClubb member`
            : `Pay to finish registering ${firstName}`}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {paid
            ? "Their membership is active, and we've emailed them a welcome and the receipt."
            : "Their registration is complete once the membership is paid."}
        </p>
      </div>

      {paid ? (
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="font-head"
            nativeButton={false}
            render={<Link href={FRANCHISE_CANDIDATES} />}
          >
            View candidates
          </Button>
          <Button
            className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            onClick={onRegisterAnother}
          >
            Register another candidate
          </Button>
        </div>
      ) : (
        <>
          <div className="mx-auto mt-6 max-w-sm">
            <CollectMembership
              candidate={candidate}
              commission
              onPaid={onPaid}
            />
          </div>
          <StayNotice hasAccount />
        </>
      )}
    </div>
  );
}

type DiscardTarget = { registrationId: string } | { candidateId: string };
type LeaveNav = { kind: "back" } | { kind: "href"; href: string };

function useLeaveGuard(active: boolean, onAttempt: (nav: LeaveNav) => void) {
  const attempt = useEffectEvent(onAttempt);
  const release = useRef(() => {});

  useEffect(() => {
    if (!active) return;
    window.history.pushState({ leaveGuard: true }, "");

    const onPopState = () => {
      // Razorpay's modal pushes its own entry, so its back press lands on ours.
      if (window.history.state?.leaveGuard) return;
      window.history.pushState({ leaveGuard: true }, "");
      attempt({ kind: "back" });
    };
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      )
        return;
      e.preventDefault();
      e.stopPropagation();
      attempt({
        kind: "href",
        href: `${url.pathname}${url.search}${url.hash}`,
      });
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();

    window.addEventListener("popstate", onPopState);
    window.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);

    let released = false;
    const stop = (popEntry: boolean) => {
      if (released) return;
      released = true;
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (popEntry && window.history.state?.leaveGuard) window.history.back();
    };
    release.current = () => stop(false);
    return () => stop(true);
  }, [active]);

  return () => release.current();
}

function StayNotice({ hasAccount }: { hasAccount: boolean }) {
  return (
    <p
      role="status"
      className="mx-auto mt-6 flex w-fit max-w-full items-start gap-1.5 rounded-xl bg-amber-500/10 px-3 py-1.5 text-left text-xs leading-5 font-medium text-amber-800 dark:text-amber-300"
    >
      <TriangleAlert className="mt-0.75 size-3.5 flex-none" />
      {hasAccount
        ? "Don't leave this page until the membership is paid."
        : "Don't leave this page until registration is complete."}
    </p>
  );
}

function LeaveDialog({
  nav,
  target,
  name,
  onCancel,
  onDiscarded,
}: {
  nav: LeaveNav | null;
  target: DiscardTarget;
  name: string;
  onCancel: () => void;
  onDiscarded: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startDiscard] = useTransition();
  const fallback = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hasAccount = "candidateId" in target;

  useEffect(() => () => clearTimeout(fallback.current), []);

  return (
    <AlertDialog.Root
      open={!!nav}
      onOpenChange={(next) => {
        if (next || pending) return;
        setError(undefined);
        onCancel();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/30 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
        <AlertDialog.Popup className="group fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-popover p-6 text-popover-foreground shadow-xl transition duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <Trash2 className="size-5" />
          </span>
          <AlertDialog.Title className="mt-4 font-head text-lg font-bold tracking-tight">
            Leave and discard {name}&apos;s registration?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-1.5 text-sm leading-6 text-muted-foreground">
            {hasAccount
              ? "Their membership isn't paid yet. Leaving permanently deletes their account and everything you entered, and no payment is taken."
              : "Their registration isn't finished. Leaving deletes everything you entered for them."}{" "}
            You can register them again later.
          </AlertDialog.Description>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Close
              disabled={pending}
              render={<Button variant="outline" className="font-head" />}
            >
              Stay and finish
            </AlertDialog.Close>
            <Button
              className="bg-destructive font-head text-white hover:bg-destructive/90"
              disabled={pending}
              onClick={() =>
                startDiscard(async () => {
                  const result = await discardRegistration(target);
                  if (result.error) {
                    setError(result.error);
                    return;
                  }
                  toast.success(`${name}'s registration is discarded`);
                  onDiscarded();
                  if (nav?.kind === "href") {
                    router.push(nav.href);
                    return;
                  }
                  // go(-2) is a no-op when there's no earlier page in the tab.
                  window.history.go(-2);
                  fallback.current = setTimeout(
                    () => router.replace(FRANCHISE_CANDIDATES),
                    400,
                  );
                })
              }
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Discard and leave
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

function CollectMembership({
  candidate,
  commission,
  onPaid,
}: {
  candidate: Pick<RegisteredCandidate, "id" | "name" | "email" | "phone">;
  commission: boolean;
  onPaid: () => void;
}) {
  const router = useRouter();
  const plan = PLAN_DETAILS[CHECKOUT_PLAN];
  const query = `candidate=${encodeURIComponent(candidate.id)}`;

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card text-left shadow-sm">
      <div className="relative overflow-hidden bg-linear-to-br from-brand-surface to-brand-surface-strong px-4 py-5 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-14 -right-14 size-36 rounded-full bg-white/10 blur-2xl"
        />
        <p className="font-head text-sm font-semibold text-white/80">
          {plan.name}
        </p>
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="font-head text-4xl font-extrabold tracking-tight">
            {plan.price}
          </span>
          <span className="text-sm text-white/75">/ year</span>
        </p>
        <p className="mt-1 text-xs text-white/75">
          GST included · Valid for 1 year from payment
        </p>
      </div>

      <div className="space-y-4 p-4">
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Billed to</dt>
            <dd className="min-w-0 truncate text-right font-medium">
              {candidate.name}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Receipt to</dt>
            <dd className="min-w-0 truncate text-right font-medium">
              {candidate.email}
            </dd>
          </div>
        </dl>

        {/* {commission && (
          <p className="flex items-center justify-between gap-3 rounded-xl bg-good/10 px-3.5 py-2.5 text-sm">
            <span className="flex items-center gap-2 font-medium text-good">
              <BadgeIndianRupee className="size-4" />
              You earn
            </span>
            <span className="font-head font-extrabold text-good">
              {formatRupees((plan.amount * 100) / 2)}
            </span>
          </p>
        )} */}

        <RazorpayCheckout<{
          invoice_number: string;
          paid_at: string;
          expires_at: string;
        }>
          label={`Pay ${plan.price}`}
          description={plan.name}
          prefill={{
            name: candidate.name,
            email: candidate.email,
            contact: candidate.phone,
          }}
          orderUrl={`/api/franchise/membership-order?${query}`}
          verifyUrl={`/api/franchise/verify-membership?${query}`}
          copy={{
            item: { label: "Candidate", value: candidate.name },
            successAction: "Done",
            retryHint:
              "The payment went through. Retry to activate the membership.",
          }}
          successMessage={(r) =>
            `${candidate.name}'s membership is active until ${formatDate(r.expires_at)}.`
          }
          onSuccessAction={() => {
            onPaid();
            router.refresh();
          }}
          className="h-12"
        />

        <div className="-mx-4 px-4 flex flex-col items-center gap-2 border-t border-border pt-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <LockKeyhole className="size-3.5" />
            Secure payment by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}

function OtpInput({
  inputRef,
  value,
  onValueChange,
  invalid,
  disabled,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onValueChange: (value: string) => void;
  invalid: boolean;
  disabled: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);
  const caretToEnd = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    if (
      input.selectionStart === 0 &&
      input.selectionEnd === input.value.length &&
      input.value
    )
      return;
    input.setSelectionRange(input.value.length, input.value.length);
  };

  return (
    <div className="relative mx-auto grid w-full max-w-[22rem] grid-cols-6 gap-2">
      {Array.from({ length: OTP_LENGTH }, (_, i) => {
        const char = value[i];
        const active = focused && i === activeIndex;
        return (
          <div
            key={i}
            aria-hidden="true"
            className={cn(
              "flex h-14 items-center justify-center rounded-xl border bg-background font-mono text-2xl font-semibold transition-all",
              char ? "border-foreground/25" : "border-input",
              active && "border-brand ring-3 ring-brand/20",
              invalid && "border-destructive bg-destructive/5 text-destructive",
              invalid && active && "ring-destructive/20",
              disabled && "opacity-60",
            )}
          >
            {char ??
              (active && (
                <span className="h-6 w-px animate-pulse bg-foreground" />
              ))}
          </div>
        );
      })}
      <input
        ref={inputRef}
        id="code"
        name="code"
        aria-label="Verification code"
        aria-invalid={invalid}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        value={value}
        disabled={disabled}
        onChange={(e) =>
          onValueChange(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))
        }
        onFocus={(e) => {
          setFocused(true);
          caretToEnd(e);
        }}
        onBlur={() => setFocused(false)}
        onClick={caretToEnd}
        className="absolute inset-0 size-full cursor-text bg-transparent text-base text-transparent caret-transparent outline-none selection:bg-transparent disabled:cursor-not-allowed"
      />
    </div>
  );
}

const PROGRESS: Partial<Record<PlacementStatus, string>> = {
  awaiting_offer: "Selected",
  offer_received: "Selected",
  released: "Selected",
  accepted: "Offer accepted",
  joined: "Joined",
  not_joined: "Did not join",
  declined: "Declined offer",
};

const helper = createColumnHelper<
  typeof adminTableFeatures,
  FranchiseCandidate
>();

const columns = helper.columns([
  helper.accessor("name", {
    header: "Candidate",
    sortFn: "text",
    cell: ({ row }) => (
      <div className="min-w-40">
        <p className="font-head font-bold">{row.original.name}</p>
        <p className="text-xs break-all text-muted-foreground">
          {row.original.email}
        </p>
      </div>
    ),
  }),
  helper.accessor("email", { header: "Email" }),
  helper.accessor("phone", {
    header: "Phone",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {getValue()}
      </span>
    ),
  }),
  helper.accessor((c) => industryName(c.industry), {
    id: "industry",
    header: "Sector",
    sortFn: "text",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue()}</span>
    ),
  }),
  helper.accessor((c) => (c.membershipPaidAt ? 1 : 0), {
    id: "membership",
    header: "Membership",
    sortFn: "basic",
    cell: ({ row }) => (
      <Badge
        className={cn(
          "font-head font-bold",
          row.original.membershipActive
            ? "bg-good/12 text-good"
            : row.original.membershipPaidAt
              ? "bg-muted text-muted-foreground"
              : "bg-amber-500/12 text-amber-700 dark:text-amber-300",
        )}
      >
        {row.original.membershipActive
          ? "Paid"
          : row.original.membershipPaidAt
            ? "Expired"
            : "Not paid yet"}
      </Badge>
    ),
  }),
  helper.accessor((c) => (c.placement ? (PROGRESS[c.placement] ?? "") : ""), {
    id: "progress",
    header: "Progress",
    sortFn: "text",
    cell: ({ row }) => {
      const label = row.original.placement
        ? PROGRESS[row.original.placement]
        : null;
      return label ? (
        <Badge
          className={cn(
            "font-head font-bold",
            row.original.placement === "joined"
              ? "bg-good text-white"
              : "bg-brand/10 text-brand",
          )}
        >
          {label}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">
          {row.original.applications}{" "}
          {row.original.applications === 1 ? "application" : "applications"}
        </span>
      );
    },
  }),
  helper.accessor("createdAt", {
    header: "Registered",
    sortFn: "basic",
    sortDescFirst: true,
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {formatDate(getValue())}
      </span>
    ),
  }),
]);

export function FranchiseCandidatesList({
  candidates,
}: {
  candidates: FranchiseCandidate[];
}) {
  return (
    <DataTable
      data={candidates}
      columns={columns}
      getRowId={(c) => c.id}
      searchable={["name", "email", "phone", "industry"]}
      searchPlaceholder="Search name, email or phone"
      initialSort={{ id: "createdAt", desc: true }}
      columnClass={{
        email: "hidden",
        phone: "hidden lg:table-cell",
        industry: "hidden xl:table-cell",
        progress: "hidden md:table-cell",
        createdAt: "hidden sm:table-cell",
      }}
      emptyTitle="No candidates match"
    />
  );
}

export function BankDetailsForm() {
  const [state, formAction, pending] = useActionState<
    SettingsActionState,
    FormData
  >(addBankDetails, {});
  const { errors, formError, clearAll, onChange } = useFieldErrors(
    state,
    state.errors,
    state.error,
  );
  const hasErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    if (state.ok) toast.success("Bank details saved");
  }, [state]);

  return (
    <form
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
      onChange={onChange}
      noValidate
    >
      <Panel
        title="Bank account for commission"
        description="Where JobClubb transfers your commission. Add it once here; after that, changes go through support@jobclubb.com."
        footer={
          <>
            <FormStatus
              error={
                formError ??
                (hasErrors
                  ? "Fix the highlighted fields and try again."
                  : undefined)
              }
            />
            <SubmitButton pending={pending}>
              {pending ? "Saving..." : "Save bank details"}
            </SubmitButton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            id="bankAccountName"
            label="Account name"
            placeholder="As it appears on the bank account"
            required
            maxLength={120}
            error={errors.bankAccountName}
          />
          <Field
            id="bankName"
            label="Bank and branch"
            placeholder="E.g., HDFC Bank, Salt Lake"
            required
            maxLength={120}
            error={errors.bankName}
          />
          <Field
            id="bankAccountNo"
            label="Account number"
            inputMode="numeric"
            autoComplete="off"
            required
            maxLength={18}
            error={errors.bankAccountNo}
          />
          <Field
            id="confirmAccountNo"
            label="Confirm account number"
            inputMode="numeric"
            autoComplete="off"
            required
            maxLength={18}
            error={errors.confirmAccountNo}
          />
          <Field
            id="bankIfsc"
            label="IFSC"
            placeholder="E.g., SBIN0001234"
            required
            maxLength={11}
            error={errors.bankIfsc}
            inputClassName="uppercase placeholder:normal-case"
          />
        </div>
        <p className="mt-5 rounded-xl bg-amber-500/10 px-3 py-2.5 text-xs leading-5 text-amber-800 dark:text-amber-300">
          Check these carefully before saving. You can&apos;t change them
          yourself afterwards.
        </p>
      </Panel>
    </form>
  );
}
