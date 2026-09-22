"use client";

import { useEffect, useState, useTransition } from "react";
import { MailCheck, RotateCw } from "lucide-react";

import { resendConfirmation } from "@/app/(auth)/sign-up/actions";
import { Button } from "@/components/ui/button";

const COOLDOWN_SECONDS = 60;

export function ResendConfirmation({
  email,
  justSent = false,
  variant = "inline",
  className = "",
}: {
  email: string;
  justSent?: boolean;
  variant?: "inline" | "button";
  className?: string;
}) {
  const [cooldown, setCooldown] = useState(justSent ? COOLDOWN_SECONDS : 0);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function resend() {
    startTransition(async () => {
      const { error } = await resendConfirmation(email);
      setStatus(error ? { ok: false, message: error } : { ok: true, message: "Sent. Check your inbox and spam folder." });
      if (!error) setCooldown(COOLDOWN_SECONDS);
    });
  }

  const label = pending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email";
  const icon = <RotateCw className={`size-4 ${pending ? "animate-spin" : ""}`} />;

  return (
    <div className={`text-sm ${className}`}>
      {variant === "button" ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={resend}
          disabled={pending || cooldown > 0}
          className="h-12 w-full font-head"
        >
          {icon}
          {label}
        </Button>
      ) : (
        <>
          <span className="text-muted-foreground">Didn&apos;t get the email? </span>
          <button
            type="button"
            onClick={resend}
            disabled={pending || cooldown > 0}
            className="inline-flex items-center gap-1 font-semibold text-brand hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
          >
            {icon}
            {label}
          </button>
        </>
      )}
      <p role="status" className="empty:hidden">
        {status && (
          <span
            className={`mt-2 flex items-center justify-center gap-1.5 text-xs ${status.ok ? "text-good" : "text-destructive"}`}
          >
            {status.ok && <MailCheck className="size-3.5" />}
            {status.message}
          </span>
        )}
      </p>
    </div>
  );
}
