"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
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
import { FormStatus, SubmitButton, submitManually } from "@/components/candidate/settings-forms";
import { Field, FieldError, SelectField, useFieldErrors } from "@/components/sign-up/fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FRANCHISE_CANDIDATES,
  OTP_LENGTH,
  OTP_TTL_MINUTES,
} from "@/lib/franchise";
import type { PlacementStatus } from "@/lib/placements";
import { INDUSTRIES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import type { FranchiseCandidate } from "@/server/franchises/franchises";

const INDUSTRY_OPTIONS = INDUSTRIES.map((i) => ({ value: i.slug, label: i.name }));
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

export function RegisterCandidateForm({ franchiseName }: { franchiseName: string }) {
  const [state, formAction, pending] = useActionState<RegistrationState, FormData>(
    startCandidateRegistration,
    {},
  );
  const { errors, formError, clear, clearAll, onChange } = useFieldErrors(state, state.errors, state.error);
  const [industry, setIndustry] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [restartError, setRestartError] = useState<string | null>(null);
  const [registered, setRegistered] = useState<Registered | null>(null);
  const [instance, setInstance] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const hasErrors = Object.keys(errors).length > 0;

  const pendingRegistration =
    state.pending && state.pending.registrationId !== dismissed ? state.pending : null;

  if (registered)
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-center sm:p-10">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-good/12 text-good">
          <CircleCheck className="size-6" />
        </span>
        <h2 className="mt-4 font-head text-xl font-extrabold tracking-tight">{registered.name} is registered</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Their email is verified and they&apos;re on your candidates list. We&apos;ve emailed them a link
          to set their password. Next, they sign in and pay the ₹1,499 membership on JobClubb.com.
          You earn half of it as soon as they pay.
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
            <Field id="firstName" label="First name" placeholder="e.g. Priya" autoComplete="off" required maxLength={80} error={errors.firstName} />
            <Field id="lastName" label="Last name" placeholder="e.g. Sharma" autoComplete="off" required maxLength={80} error={errors.lastName} />
            <Field
              id="email"
              label="Candidate's email"
              type="email"
              placeholder="their@email.com"
              autoComplete="off"
              required
              error={errors.email}
              className="sm:col-span-2"
            />
            <Field
              id="phone"
              label="Mobile number"
              type="tel"
              placeholder="e.g. 7987654321"
              autoComplete="off"
              required
              error={errors.phone}
              className="sm:col-span-2"
            />
          </div>
        </Section>

        <Section
          icon={MapPin}
          title="Their preferences"
          description="Used to match them with openings near them."
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field id="city" label="City" placeholder="e.g. Kolkata" autoComplete="off" required maxLength={80} error={errors.city} />
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
              The candidate is with me and agrees to share these details with {franchiseName} and
              JobClubb to register and find a job. I haven&apos;t taken any payment from them: they pay
              JobClubb directly.
            </span>
          </label>
          <input type="hidden" name="consent" value={consent ? "yes" : ""} />
          <FieldError message={errors.consent} />
        </Section>

        <div className="flex flex-col-reverse gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <FormStatus
            error={restartError ?? formError ?? (hasErrors ? "Fix the highlighted fields and try again." : undefined)}
          />
          <SubmitButton pending={pending}>{pending ? "Sending code..." : "Send code to candidate"}</SubmitButton>
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
  const { formError, clearAll, onChange } = useFieldErrors(state, {}, state.error);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, startResend] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (state.registered) onRegistered(state.registered);
    else if (state.restart && state.error) onRestart(state.error);
  }, [state, onRegistered, onRestart]);

  useEffect(() => inputRef.current?.focus(), []);

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Change details
      </button>
      <div className="mt-5 flex items-start gap-3">
        <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-brand/10 text-brand">
          <MailCheck className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-head text-lg font-extrabold tracking-tight">Enter the code we emailed {name}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            We sent a {OTP_LENGTH}-digit code to <span className="font-semibold break-all text-foreground">{email}</span>.
            It expires in {OTP_TTL_MINUTES} minutes. Ask the candidate to check their spam folder if it
            hasn&apos;t arrived.
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          clearAll();
          submitManually(formAction)(e);
        }}
        onChange={onChange}
        noValidate
        className="mt-6 space-y-4"
      >
        <div className="max-w-xs space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            ref={inputRef}
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            placeholder="••••••"
            aria-invalid={!!formError}
            className="h-12 bg-card text-center font-mono text-xl tracking-[0.5em]"
          />
        </div>
        <FormStatus error={formError} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SubmitButton pending={pending}>{pending ? "Verifying..." : "Verify and register"}</SubmitButton>
          <Button
            type="button"
            variant="ghost"
            className="font-head"
            disabled={cooldown > 0 || resending || pending}
            onClick={() =>
              startResend(async () => {
                const result = await resendCandidateCode(registrationId);
                if (result.restart && result.error) return onRestart(result.error);
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success("New code sent");
                setCooldown(RESEND_COOLDOWN_SECONDS);
              })
            }
          >
            {resending && <Loader2 className="size-4 animate-spin" />}
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </Button>
        </div>
      </form>
    </section>
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

const helper = createColumnHelper<typeof adminTableFeatures, FranchiseCandidate>();

const columns = helper.columns([
  helper.accessor("name", {
    header: "Candidate",
    sortFn: "text",
    cell: ({ row }) => (
      <div className="min-w-40">
        <p className="font-head font-bold">{row.original.name}</p>
        <p className="text-xs break-all text-muted-foreground">{row.original.email}</p>
      </div>
    ),
  }),
  helper.accessor("email", { header: "Email" }),
  helper.accessor("phone", {
    header: "Phone",
    enableSorting: false,
    cell: ({ getValue }) => <span className="whitespace-nowrap text-muted-foreground">{getValue()}</span>,
  }),
  helper.accessor((c) => industryName(c.industry), {
    id: "industry",
    header: "Sector",
    sortFn: "text",
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
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
        {row.original.membershipActive ? "Paid" : row.original.membershipPaidAt ? "Expired" : "Not paid yet"}
      </Badge>
    ),
  }),
  helper.accessor((c) => (c.placement ? (PROGRESS[c.placement] ?? "") : ""), {
    id: "progress",
    header: "Progress",
    sortFn: "text",
    cell: ({ row }) => {
      const label = row.original.placement ? PROGRESS[row.original.placement] : null;
      return label ? (
        <Badge
          className={cn(
            "font-head font-bold",
            row.original.placement === "joined" ? "bg-good text-white" : "bg-brand/10 text-brand",
          )}
        >
          {label}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">
          {row.original.applications} {row.original.applications === 1 ? "application" : "applications"}
        </span>
      );
    },
  }),
  helper.accessor("createdAt", {
    header: "Registered",
    sortFn: "basic",
    sortDescFirst: true,
    cell: ({ getValue }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(getValue())}</span>,
  }),
  helper.display({
    id: "actions",
    header: "",
    cell: ({ row }) =>
      row.original.membershipPaidAt ? null : <ResendWelcome candidateId={row.original.id} />,
  }),
]);

function ResendWelcome({ candidateId }: { candidateId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      className="font-head whitespace-nowrap"
      disabled={pending}
      title="Email them a new link to set their password"
      onClick={() =>
        startTransition(async () => {
          const { error } = await resendWelcomeEmail(candidateId);
          if (error) toast.error(error);
          else toast.success("Password email sent");
        })
      }
    >
      {pending && <Loader2 className="size-3.5 animate-spin" />}
      Resend email
    </Button>
  );
}

export function FranchiseCandidatesList({ candidates }: { candidates: FranchiseCandidate[] }) {
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
