"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { createColumnHelper } from "@tanstack/react-table";
import {
  ArrowLeft,
  CircleCheck,
  Loader2,
  MailCheck,
  MapPin,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  addBankDetails,
  resendCandidateCode,
  resendWelcomeEmail,
  startCandidateRegistration,
  verifyCandidateCode,
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
import {
  Field,
  FieldError,
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
import type { PlacementStatus } from "@/lib/placements";
import { INDUSTRIES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import type { FranchiseCandidate } from "@/server/franchises/franchises";

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

type Registered = { candidateId: string; name: string };

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
  const [registered, setRegistered] = useState<Registered | null>(null);
  const [instance, setInstance] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const hasErrors = Object.keys(errors).length > 0;

  const pendingRegistration =
    state.pending && state.pending.registrationId !== dismissed
      ? state.pending
      : null;

  if (registered)
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-center sm:p-10">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-good/12 text-good">
          <CircleCheck className="size-6" />
        </span>
        <h2 className="mt-4 font-head text-xl font-extrabold tracking-tight">
          {registered.name} is registered
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Their email is verified and they&apos;re on your candidates list.
          We&apos;ve emailed them a link to set their password. Next, they sign
          in and pay the ₹1,499 membership on JobClubb.com. You earn half of it
          as soon as they pay.
        </p>
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
            onClick={() => {
              setRegistered(null);
              setDismissed(state.pending?.registrationId ?? null);
              setIndustry(null);
              setConsent(false);
              setInstance((n) => n + 1);
            }}
          >
            Register another candidate
          </Button>
        </div>
      </div>
    );

  return (
    <>
      {pendingRegistration && (
        <VerifyCode
          key={pendingRegistration.registrationId}
          registrationId={pendingRegistration.registrationId}
          email={pendingRegistration.email}
          name={pendingRegistration.name}
          onBack={() => setDismissed(pendingRegistration.registrationId)}
          onRestart={(message) => {
            setDismissed(pendingRegistration.registrationId);
            setRestartError(message);
          }}
          onRegistered={setRegistered}
        />
      )}

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
              {franchiseName} and JobClubb to register and find a job. I
              haven&apos;t taken any payment from them: they pay JobClubb
              directly.
            </span>
          </label>
          <input type="hidden" name="consent" value={consent ? "yes" : ""} />
          <FieldError message={errors.consent} />
        </Section>

        <div className="flex flex-col-reverse gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <FormStatus
            error={
              restartError ??
              formError ??
              (hasErrors
                ? "Fix the highlighted fields and try again."
                : undefined)
            }
          />
          <SubmitButton pending={pending}>
            {pending ? "Sending code..." : "Send code to candidate"}
          </SubmitButton>
        </div>
      </form>
    </>
  );
}

function VerifyCode({
  registrationId,
  email,
  name,
  onBack,
  onRestart,
  onRegistered,
}: {
  registrationId: string;
  email: string;
  name: string;
  onBack: () => void;
  onRestart: (message: string) => void;
  onRegistered: (registered: Registered) => void;
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
    if (state.registered) onRegistered(state.registered);
    else if (state.restart && state.error) onRestart(state.error);
    else if (state.error) inputRef.current?.select();
  }, [state, onRegistered, onRestart]);

  useEffect(() => inputRef.current?.focus(), []);

  useEffect(() => {
    if (code.length !== OTP_LENGTH || pending || autoSubmitted.current === code)
      return;
    autoSubmitted.current = code;
    formRef.current?.requestSubmit();
  }, [code, pending]);

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Change details
      </button>

      <div className="mx-auto mt-4 flex max-w-sm flex-col items-center text-center sm:mt-2">
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
            {pending ? "Verifying..." : "Verify and register"}
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
      </div>
    </section>
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
  helper.display({
    id: "actions",
    header: "",
    cell: ({ row }) =>
      row.original.membershipPaidAt ? null : (
        <ResendWelcome candidateId={row.original.id} />
      ),
  }),
]);

function ResendWelcome({ candidateId }: { candidateId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      title="Email them a new link to set their password"
      onClick={() =>
        startTransition(async () => {
          const { error } = await resendWelcomeEmail(candidateId);
          if (error) toast.error(error);
          else toast.success("Password email sent");
        })
      }
      className="inline-flex items-center gap-1.5 font-head text-sm font-semibold whitespace-nowrap text-brand underline underline-offset-2 transition-colors hover:text-brand-dark disabled:pointer-events-none disabled:opacity-60"
    >
      {pending && <Loader2 className="size-3.5 animate-spin" />}
      Resend email
    </button>
  );
}

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
