"use client";

import { useActionState } from "react";
import { ArrowRight, CircleAlert, LockKeyhole, TimerOff } from "lucide-react";
import Link from "next/link";

import type { ResetRole } from "@/app/(auth)/forgot-password/actions";
import { resetPassword, type ResetPasswordState } from "@/app/(auth)/reset-password/actions";
import {
  AuthCard,
  BackToSignIn,
  CardIcon,
} from "@/components/forgot-password/forgot-password";
import { PasswordField, useFieldErrors } from "@/components/sign-up/fields";
import { Button } from "@/components/ui/button";

export function ResetPassword({
  tokenHash,
  role,
  welcome = false,
}: {
  tokenHash: string;
  role: ResetRole;
  welcome?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(
    resetPassword,
    { tokenHash, role, expired: !tokenHash },
  );
  const { errors, formError, clearAll, onChange } = useFieldErrors(
    state,
    state.errors,
    state.error,
  );

  if (state.expired) {
    return (
      <AuthCard>
        <CardIcon icon={TimerOff} tone="destructive" />
        <h1 className="mt-5 font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
          This link has expired
        </h1>
        <p className="mt-2 leading-7 text-muted-foreground">
          {welcome
            ? "Links to set your password work once and expire after 1 hour. Request a new one with your email and use the latest email we send you."
            : "Password reset links work once and expire after 1 hour. Request a new one and use the latest email we send you."}
        </p>
        <Button
          nativeButton={false}
          size="lg"
          className="mt-7 h-12 w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
          render={<Link href={`/forgot-password?as=${role}`} />}
        >
          Request a new link
          <ArrowRight className="size-4" />
        </Button>
        <BackToSignIn role={role} />
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <CardIcon icon={LockKeyhole} />
      <h1 className="mt-5 font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
        {welcome ? "Set your password" : "Choose a new password"}
      </h1>
      <p className="mt-2 leading-7 text-muted-foreground">
        {welcome
          ? "Your JobClubb account is ready. Choose a password to sign in to it."
          : `You'll use it to sign in to your ${role} account. We'll sign you out on every other device.`}
      </p>

      <form
        noValidate
        action={formAction}
        onSubmit={clearAll}
        onChange={onChange}
        className="mt-6 space-y-5"
      >
        {formError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 flex-none" />
            {formError}
          </p>
        )}
        <PasswordField
          id="password"
          label="New password"
          hint="At least 8 characters."
          placeholder="••••••••"
          error={errors.password}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          placeholder="••••••••"
          error={errors.confirmPassword}
        />

        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-12 w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
        >
          {pending ? "Updating…" : "Update password"}
          {!pending && <ArrowRight className="size-4" />}
        </Button>
      </form>

      <BackToSignIn role={role} />
    </AuthCard>
  );
}
