import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileText,
  Mail,
  Search,
  ShieldCheck,
  Timer,
} from "lucide-react";

import { ResendConfirmation } from "@/components/sign-up/resend-confirmation";
import { PanelCard } from "@/components/sign-up/sign-up-layout";
import { Button } from "@/components/ui/button";
import { inboxFor } from "@/lib/inbox-providers";

const PROGRESS = [
  { title: "Profile created", detail: "Your details are saved" },
  { title: "Confirm your email", detail: "Click the link we just sent you" },
  {
    title: "Sign in & build your resume",
    detail: "Your AI-built, ATS-ready resume is waiting",
  },
];
const CURRENT = 1;

export function CheckInbox({ email }: { email?: string }) {
  const inbox = email ? inboxFor(email) : undefined;

  return (
    <div className="flex-1 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="jc-auth-panel relative isolate hidden overflow-hidden text-white lg:sticky lg:top-18 lg:block lg:h-[calc(100dvh-72px)]">
        <div className="mx-auto flex h-full max-w-xl flex-col justify-center px-10 py-10 xl:px-14">
          <p className="font-head text-xs font-bold tracking-[0.14em] text-brand-accent uppercase">
            Account created
          </p>
          <h1 className="mt-3 font-head text-4xl leading-[1.1] font-extrabold tracking-tight xl:text-[2.75rem]">
            You&apos;re almost <span className="text-brand-accent">in</span>.
          </h1>
          <p className="mt-4 max-w-md leading-7 text-white/70">
            One quick check that this email is really yours, then you can sign
            in and start applying to verified openings.
          </p>

          <div className="mt-10">
            <PanelCard
              label="Your progress"
              badge={
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                  Step {CURRENT + 1} of {PROGRESS.length}
                </span>
              }
            >
              <ol>
                {PROGRESS.map((step, i) => (
                  <ProgressStep
                    key={step.title}
                    {...step}
                    state={
                      i < CURRENT
                        ? "done"
                        : i === CURRENT
                          ? "current"
                          : "upcoming"
                    }
                    last={i === PROGRESS.length - 1}
                  />
                ))}
              </ol>
            </PanelCard>
          </div>

          <p className="mt-8 flex items-center gap-2.5 text-sm text-white/60">
            <ShieldCheck className="size-4 flex-none text-brand-accent" />
            Confirming your email keeps your profile and applications secure.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 items-center px-4 py-10 sm:px-8 lg:px-12 lg:py-14 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <MobileProgress />


          <h2 className="font-head text-3xl font-extrabold tracking-tight sm:text-4xl">
            Check your inbox
          </h2>
          <p className="mt-2 leading-7 text-muted-foreground">
            We&apos;ve sent a confirmation link to{" "}
            {email ? "" : "your email address."}
          </p>

          {email && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
              <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Mail className="size-4" />
              </span>
              <span className="min-w-0 flex-1 font-semibold break-all">
                {email}
              </span>
              <Link
                href="/sign-up"
                className="hidden flex-none text-xs font-semibold text-brand hover:underline sm:block"
              >
                Wrong email?
              </Link>
            </div>
          )}

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Click the link to activate your account, then sign in.
            {email && (
              <>
                {" "}
                <Link
                  href="/sign-up"
                  className="font-semibold text-brand hover:underline sm:hidden"
                >
                  Wrong email?
                </Link>
              </>
            )}
          </p>

          <div className="mt-7 space-y-3">
            {inbox && (
              <Button
                nativeButton={false}
                size="lg"
                className="h-12 w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                render={
                  <a
                    href={inbox.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                Open {inbox.name}
              </Button>
            )}
            {email && (
              <ResendConfirmation email={email} variant="button" justSent />
            )}
          </div>

          <div className="mt-8 rounded-2xl bg-muted/60 p-5">
            <p className="font-head text-sm font-bold">Can&apos;t find it?</p>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <Tip icon={Mail}>Check your Spam and Promotions folders.</Tip>
              <Tip icon={Search}>
                Search your inbox for{" "}
                <span className="font-semibold text-foreground">JobClubb</span>.
              </Tip>
              <Tip icon={Timer}>
                The link expires in 1 hour.{" "}
                {email
                  ? "Resend for a fresh one."
                  : "Sign in to get a fresh one."}
              </Tip>
            </ul>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already confirmed?{" "}
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
            >
              Sign in
              <ArrowRight className="size-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgressStep({
  title,
  detail,
  state,
  last,
}: {
  title: string;
  detail: string;
  state: "done" | "current" | "upcoming";
  last: boolean;
}) {
  return (
    <li
      className="relative flex gap-4 pb-6 last:pb-0"
      aria-current={state === "current" ? "step" : undefined}
    >
      {!last && (
        <span
          aria-hidden
          className={`absolute top-8 bottom-1 left-[15px] w-0.5 rounded-full ${
            state === "done" ? "bg-brand-accent/70" : "bg-white/15"
          }`}
        />
      )}
      <span
        className={`relative flex size-8 flex-none items-center justify-center rounded-full font-head text-xs font-bold ${
          state === "done"
            ? "bg-brand-accent text-brand-surface-strong"
            : state === "current"
              ? "bg-white text-brand-surface-strong ring-4 ring-white/20"
              : "bg-white/10 text-white/50"
        }`}
      >
        {state === "done" ? (
          <Check className="size-4" strokeWidth={3} />
        ) : state === "current" ? (
          <Mail className="size-4" />
        ) : (
          <FileText className="size-4" />
        )}
      </span>
      <span className="pt-1">
        <span
          className={`block font-head text-sm font-bold ${state === "upcoming" ? "text-white/55" : "text-white"}`}
        >
          {title}
          {state === "current" && (
            <span className="ml-2 rounded-full bg-brand-accent/20 px-2 py-0.5 align-middle text-[10px] font-bold tracking-wide text-brand-accent uppercase">
              Now
            </span>
          )}
        </span>
        <span
          className={`mt-0.5 block text-xs ${state === "upcoming" ? "text-white/40" : "text-white/60"}`}
        >
          {detail}
        </span>
      </span>
    </li>
  );
}

function MobileProgress() {
  return (
    <div className="lg:hidden">
      <div className="grid grid-cols-3 gap-2">
        {PROGRESS.map((step, i) => (
          <span
            key={step.title}
            className={`h-1.5 rounded-full ${
              i < CURRENT
                ? "bg-brand"
                : i === CURRENT
                  ? "bg-linear-to-r from-brand to-brand-accent"
                  : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="mt-2.5 font-head text-xs font-bold tracking-[0.14em] text-brand uppercase">
        Step {CURRENT + 1} of {PROGRESS.length} · {PROGRESS[CURRENT].title}
      </p>
    </div>
  );
}

function Tip({
  icon: Icon,
  children,
}: {
  icon: typeof Mail;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 flex-none text-brand" />
      <span>{children}</span>
    </li>
  );
}
