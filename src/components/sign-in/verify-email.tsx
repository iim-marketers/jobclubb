"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, ExternalLink, Mail, MailCheck } from "lucide-react";

import { ResendConfirmation } from "@/components/sign-up/resend-confirmation";
import { Button } from "@/components/ui/button";
import { inboxFor } from "@/lib/inbox-providers";

export function VerifyEmail({ email, onBack }: { email: string; onBack: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inbox = inboxFor(email);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
      <span className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
        <MailCheck className="size-6" />
      </span>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-5 font-head text-2xl font-extrabold tracking-tight outline-none sm:text-3xl"
      >
        Verify your email
      </h2>
      <p className="mt-2 leading-7 text-muted-foreground">
        Your account is almost ready. Click the confirmation link we sent to
      </p>
      <p className="mt-3 flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold">
        <Mail className="size-4 flex-none text-muted-foreground" />
        <span className="break-all">{email}</span>
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Once it&apos;s confirmed, come back here and sign in. Can&apos;t find it?
        Check your spam or promotions folder.
      </p>

      <div className="mt-7 space-y-3">
        {inbox && (
          <Button
            nativeButton={false}
            size="lg"
            className="h-12 w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            render={<a href={inbox.url} target="_blank" rel="noopener noreferrer" />}
          >
            Open {inbox.name}
            <ExternalLink className="size-4" />
          </Button>
        )}
        <ResendConfirmation email={email} variant="button" />
      </div>

      <div className="mt-6 border-t border-border pt-5 text-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </button>
      </div>
    </div>
  );
}
