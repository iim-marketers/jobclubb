"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  KeyRound,
  Mail,
  MailCheck,
} from "lucide-react";

import {
  requestPasswordReset,
  type ResetRole,
} from "@/app/(auth)/forgot-password/actions";
import { FieldError } from "@/components/sign-up/fields";
import { ResendConfirmation } from "@/components/sign-up/resend-confirmation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inboxFor } from "@/lib/inbox-providers";

export function ForgotPassword({ role }: { role: ResetRole }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <AuthCard>
      {sent ? (
        <ResetSent role={role} email={email} onBack={() => setSent(false)} />
      ) : (
        <>
          <CardIcon icon={KeyRound} />
          <h1 className="mt-5 font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
            Forgot your password?
          </h1>
          <p className="mt-2 leading-7 text-muted-foreground">
            Enter the email you use for your {role} account and we&apos;ll
            send you a link to choose a new one.
          </p>

          <form
            noValidate
            className="mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              const address = String(
                new FormData(e.currentTarget).get("email") ?? "",
              ).trim();
              startTransition(async () => {
                const result = await requestPasswordReset(address);
                setError(result.error);
                if (result.error) return;
                setEmail(address);
                setSent(true);
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={
                    role === "company" ? "you@yourcompany.com" : "you@example.com"
                  }
                  autoComplete="email"
                  autoFocus
                  defaultValue={email}
                  aria-invalid={!!error}
                  onChange={() => setError(undefined)}
                  className="h-11 bg-card pl-10"
                />
              </div>
              <FieldError message={error} />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="h-12 w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            >
              {pending ? "Sending…" : "Send reset link"}
              {!pending && <ArrowRight className="size-4" />}
            </Button>
          </form>

          <BackToSignIn role={role} />
        </>
      )}
    </AuthCard>
  );
}

function ResetSent({
  role,
  email,
  onBack,
}: {
  role: ResetRole;
  email: string;
  onBack: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inbox = inboxFor(email);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
      <CardIcon icon={MailCheck} />
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-5 font-head text-2xl font-extrabold tracking-tight outline-none sm:text-3xl"
      >
        Check your inbox
      </h1>
      <p className="mt-2 leading-7 text-muted-foreground">
        If a {role} account exists for this email, we&apos;ve sent it a link to
        reset your password.
      </p>
      <p className="mt-3 flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold">
        <Mail className="size-4 flex-none text-muted-foreground" />
        <span className="min-w-0 flex-1 break-all">{email}</span>
        <button
          type="button"
          onClick={onBack}
          className="flex-none text-xs font-semibold text-brand hover:underline"
        >
          Wrong email?
        </button>
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        The link expires in 1 hour. Can&apos;t find it? Check your spam or
        promotions folder.
      </p>

      <div className="mt-7 space-y-3">
        {inbox && (
          <Button
            nativeButton={false}
            size="lg"
            className="h-12 w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            render={
              <a href={inbox.url} target="_blank" rel="noopener noreferrer" />
            }
          >
            Open {inbox.name}
          </Button>
        )}
        <ResendConfirmation
          email={email}
          variant="button"
          justSent
          send={requestPasswordReset}
        />
      </div>

      <BackToSignIn role={role} />
    </div>
  );
}

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:py-16">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

export function CardIcon({
  icon: Icon,
  tone = "brand",
}: {
  icon: typeof Mail;
  tone?: "brand" | "destructive";
}) {
  return (
    <span
      className={`flex size-12 items-center justify-center rounded-full ${
        tone === "brand"
          ? "bg-brand/10 text-brand"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      <Icon className="size-6" />
    </span>
  );
}

export function BackToSignIn({ role }: { role: ResetRole }) {
  return (
    <div className="mt-6 border-t border-border pt-5 text-center">
      <Link
        href={`/sign-in?as=${role}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to sign in
      </Link>
    </div>
  );
}
