"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import {
  ArrowRight,
  Building2,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Store,
  User,
} from "lucide-react";

import { signIn, type SignInRole } from "@/app/(auth)/sign-in/actions";
import { FieldError } from "@/components/sign-up/fields";
import { VerifyEmail } from "@/components/sign-in/verify-email";
import { PanelCard } from "@/components/sign-up/sign-up-layout";
import { useFitToHeight } from "@/components/sign-up/use-fit-to-height";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FieldErrors } from "@/lib/sign-up-validation";

const ROLES: {
  id: SignInRole;
  label: string;
  icon: typeof User;
  eyebrow: string;
  title: [string, string, string];
  description: string;
}[] = [
  {
    id: "candidate",
    label: "Candidate",
    icon: User,
    eyebrow: "Welcome back",
    title: ["Pick up ", "where you left", " off."],
    description:
      "Your matched openings, applications and ATS-ready resume are waiting for you.",
  },
  {
    id: "company",
    label: "Company",
    icon: Building2,
    eyebrow: "For employers",
    title: ["Your next hire is ", "already here", "."],
    description:
      "Review candidates by skills and experience, and manage your postings and HR seats.",
  },
  {
    id: "franchise",
    label: "Franchise",
    icon: Store,
    eyebrow: "For franchise partners",
    title: ["Track every lead, ", "sent to placed", "."],
    description:
      "Add leads, follow up on payments and see your conversions in one dashboard.",
  },
];

export function SignIn({
  initialRole,
  next,
  linkExpired,
  verified,
  verifiedEmail,
  freshRoles,
}: {
  initialRole: SignInRole;
  freshRoles: string[];
  next?: string;
  linkExpired?: boolean;
  verified?: boolean;
  verifiedEmail?: string;
}) {
  const [role, setRole] = useState<SignInRole>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string>();
  const [pending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  useFitToHeight(panelRef);

  const active = ROLES.find((r) => r.id === role)!;
  const clearError = (key: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  return (
    <div className="grid h-[calc(100dvh-65px)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden lg:h-[calc(100dvh-73px)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-1">
      <aside className="jc-auth-panel relative isolate overflow-hidden text-white">
        <div
          ref={panelRef}
          className="mx-auto flex h-full max-w-xl flex-col justify-center px-4 py-6 short:py-4 sm:px-8 lg:overflow-hidden lg:px-10 lg:py-10 xl:px-14"
        >
          <div
            key={role}
            className="animate-in fade-in duration-500 motion-reduce:animate-none"
          >
            <p className="font-head text-xs font-bold tracking-[0.14em] text-brand-accent uppercase max-lg:short:hidden">
              {active.eyebrow}
            </p>
            <h1 className="mt-2 max-lg:short:mt-0 font-head text-2xl leading-[1.1] font-extrabold tracking-tight sm:text-3xl lg:mt-3 lg:text-4xl xl:text-[2.75rem]">
              {active.title[0]}
              <span className="text-brand-accent">{active.title[1]}</span>
              {active.title[2]}
            </h1>
            <p
              data-fit="6"
              className="mt-4 hidden max-w-md leading-7 text-white/70 lg:block"
            >
              {active.description}
            </p>

            <div data-fit="5" className="mt-10 hidden lg:block">
              {role === "candidate" && <CandidatePreview roles={freshRoles} />}
              {role === "company" && <CompanyPreview />}
              {role === "franchise" && <FranchisePreview />}
            </div>
          </div>
        </div>
      </aside>

      <div className="overflow-y-auto">
        <div className="flex min-h-full md:items-center justify-center px-4 py-6 short:py-3 sm:px-8 lg:py-10 lg:short:py-4">
          <div className="w-full max-w-md">
            {unconfirmedEmail && (
              <VerifyEmail
                key={unconfirmedEmail}
                email={unconfirmedEmail}
                onBack={() => setUnconfirmedEmail(undefined)}
              />
            )}
            <div hidden={!!unconfirmedEmail}>
              <h2 className="font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
                Sign in
              </h2>
              <p className="mt-1.5 text-muted-foreground short:hidden">
                Choose your account type to continue.
              </p>

              <form
                noValidate
                className="mt-6 space-y-5 short:mt-4 short:space-y-3.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  startTransition(async () => {
                    const result = await signIn(formData);
                    if (result) {
                      setErrors(result.errors);
                      setUnconfirmedEmail(result.unconfirmedEmail);
                    }
                  });
                }}
              >
                {next && <input type="hidden" name="next" value={next} />}
                {linkExpired && (
                  <p
                    role="alert"
                    className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  >
                    <CircleAlert className="size-4 flex-none" />
                    That link has expired or was already used. Sign in below.
                  </p>
                )}
                {verified && (
                  <p
                    role="status"
                    className="flex items-start gap-2 rounded-xl bg-good/10 px-4 py-3 text-sm text-good"
                  >
                    <CircleCheck className="mt-0.5 size-4 flex-none" />
                    Email confirmed. Sign in with your password to get started.
                  </p>
                )}
                <div
                  role="radiogroup"
                  aria-label="Account type"
                  className="grid grid-cols-3 gap-2"
                >
                  {ROLES.map(({ id, label, icon: Icon }) => (
                    <label
                      key={id}
                      className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-2 py-3 short:py-2 font-head text-xs font-semibold text-muted-foreground transition-all hover:border-brand/50 hover:text-foreground has-checked:border-brand has-checked:bg-brand has-checked:text-brand-foreground has-checked:shadow-md has-checked:shadow-brand/20 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
                    >
                      <input
                        type="radio"
                        name="role"
                        value={id}
                        checked={role === id}
                        onChange={() => setRole(id)}
                        className="sr-only"
                      />
                      <Icon className="size-5" />
                      {label}
                    </label>
                  ))}
                </div>
                <FieldError message={errors.role} />

                <IconField
                  id="email"
                  label="Email"
                  type="email"
                  icon={Mail}
                  placeholder={
                    role === "candidate"
                      ? "you@example.com"
                      : "you@yourcompany.com"
                  }
                  autoComplete="email"
                  defaultValue={verifiedEmail}
                  error={errors.email}
                  onEdit={() => clearError("email")}
                />

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      autoFocus={!!verifiedEmail}
                      aria-invalid={!!errors.password}
                      onChange={() => clearError("password")}
                      className="h-11 bg-card pr-11 pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <FieldError message={errors.password} />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
                    <Checkbox name="remember" value="yes" />
                    Keep me signed in
                  </label>
                  <Link
                    href="/forgot-password"
                    className="-my-1 py-1 text-sm font-semibold text-brand hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={pending}
                  className="h-12 w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                >
                  {pending
                    ? "Signing in…"
                    : `Sign in as ${active.label.toLowerCase()}`}
                  {!pending && <ArrowRight className="size-4" />}
                </Button>
              </form>

              <div className="mt-6 border-t border-border pt-5 short:mt-4 short:pt-3 text-center text-sm text-muted-foreground">
                {role === "candidate" && (
                  <>
                    New to JobClubb?{" "}
                    <Link
                      href="/sign-up"
                      className="font-semibold text-brand hover:underline"
                    >
                      Create an account
                    </Link>
                  </>
                )}
                {role === "company" && (
                  <>
                    Not registered yet?{" "}
                    <Link
                      href="/sign-up/company"
                      className="font-semibold text-brand hover:underline"
                    >
                      Register your company
                    </Link>
                  </>
                )}
                {role === "franchise" && (
                  <>
                    Got your franchise email ID?{" "}
                    <Link
                      href="/sign-up/franchise"
                      className="font-semibold text-brand hover:underline"
                    >
                      Activate your franchise
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconField({
  id,
  label,
  icon: Icon,
  error,
  onEdit,
  ...inputProps
}: {
  id: string;
  label: string;
  icon: typeof Mail;
  error?: string;
  onEdit: () => void;
} & Pick<
  React.ComponentProps<"input">,
  "type" | "placeholder" | "autoComplete" | "defaultValue"
>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          name={id}
          aria-invalid={!!error}
          onChange={onEdit}
          className="h-11 bg-card pl-10"
          {...inputProps}
        />
      </div>
      <FieldError message={error} />
    </div>
  );
}

// ---- Role previews in the brand panel. Lower rows carry higher `data-fit`
// numbers so they're the first to go on short screens.

// Only role names reach this client component; the rest is blurred placeholder.
function CandidatePreview({ roles }: { roles: string[] }) {
  return (
    <PanelCard
      label="Fresh openings today"
      badge={
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-accent">
          <span className="size-1.5 animate-pulse rounded-full bg-brand-accent" />
          Live
        </span>
      }
    >
      <ul className="space-y-2">
        {roles.map((role, i) => (
          <li
            key={role}
            data-fit={9 - i}
            className="flex items-center gap-3 rounded-2xl bg-black/15 p-3"
          >
            <span
              aria-hidden
              className="size-9 flex-none rounded-full bg-white/20 ring-2 ring-white/15 blur-[3px]"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-head text-sm font-bold">{role}</p>
              <p
                aria-hidden
                className="truncate text-xs text-white/60 blur-[4px] select-none"
              >
                Company name · City
              </p>
            </div>
            <span
              aria-hidden
              className="font-head text-sm font-bold text-brand-accent blur-[4px] select-none"
            >
              ₹0L
            </span>
          </li>
        ))}
      </ul>
    </PanelCard>
  );
}

const SAMPLE_POOL = [
  {
    ref: "CAND-4821",
    meta: "3 yrs · Airlines",
    skills: ["Cabin safety", "Guest handling"],
  },
  {
    ref: "CAND-4844",
    meta: "5 yrs · Hotels",
    skills: ["Front office", "Opera PMS"],
  },
  {
    ref: "CAND-4851",
    meta: "2 yrs · Hotels",
    skills: ["F&B service", "Banquets"],
  },
];

function CompanyPreview() {
  return (
    <PanelCard
      label="Candidate pool"
      badge={
        <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
          <EyeOff className="size-3" />
          Identity hidden
        </span>
      }
    >
      <ul className="space-y-2">
        {SAMPLE_POOL.map((c, i) => (
          <li
            key={c.ref}
            data-fit={9 - i}
            className="rounded-2xl bg-black/15 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs font-semibold text-white">
                {c.ref}
              </span>
              <span className="text-xs text-white/60">{c.meta}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {c.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/80"
                >
                  {s}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </PanelCard>
  );
}

function FranchisePreview() {
  return (
    <PanelCard
      label="Lead tracking"
      badge={
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/60">
          Example
        </span>
      }
    >
      <div className="space-y-4 rounded-2xl bg-black/15 p-4">
        <LeadBar
          label="Leads sent"
          value={48}
          width="100%"
          tone="bg-white/70"
        />
        <LeadBar
          label="Leads placed"
          value={19}
          width="40%"
          tone="bg-brand-accent"
        />
      </div>
      <p data-fit="9" className="mt-4 text-xs leading-5 text-white/60">
        Unpaid leads stay on your dashboard until they pay the registration fee
        or head office converts them.
      </p>
    </PanelCard>
  );
}

function LeadBar({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: number;
  width: string;
  tone: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="font-head text-xl font-extrabold">{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${tone}`} style={{ width }} />
      </div>
    </div>
  );
}
