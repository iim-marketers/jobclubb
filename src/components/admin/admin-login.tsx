/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  CircleAlert,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { adminSignIn } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLogin() {
  const [error, setError] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, startTransition] = useTransition();

  const submitForm = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(undefined);
    startTransition(async () => {
      const result = await adminSignIn(formData);
      if (result) setError(result.error);
    });
  };

  return (
    <main className="jc-auth-panel relative isolate flex min-h-dvh flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center text-white">
          <Image
            src="/brand/jobclubb-logo-dark.png"
            alt="JobClubb"
            width={150}
            height={28}
            className="h-7 w-auto object-contain"
            priority
          />
          <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1 font-head text-[11px] font-bold tracking-[0.14em] text-white/80 uppercase">
            <ShieldCheck className="size-3.5 text-brand-accent" />
            Admin console
          </span>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/20 sm:p-8">
          <h1 className="font-head text-2xl font-extrabold tracking-tight">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Restricted to JobClubb platform administrators.
          </p>

          <form noValidate className="mt-6 space-y-4" onSubmit={submitForm}>
            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                <CircleAlert className="mt-0.5 size-4 flex-none" />
                {error}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@jobclubb.com"
                  autoFocus
                  aria-invalid={!!error}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  aria-invalid={!!error}
                  className="h-11 pr-11 pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="h-11 w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            >
              {pending ? "Signing in…" : "Sign in"}
              {!pending && <ArrowRight className="size-4" />}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
