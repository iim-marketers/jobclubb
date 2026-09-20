import Link from "next/link";
import { Building2, Store, User } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = {
  title: "Sign in — JobClubb",
  description: "Sign in to your JobClubb candidate, company or franchise account.",
};

const ACCOUNT_TYPES = [
  { icon: User, label: "Candidate", href: "/dashboard" },
  { icon: Building2, label: "Company", href: "/company" },
  { icon: Store, label: "Franchise", href: "/franchise/dashboard" },
];

export default function SignInPage() {
  return (
    <PageShell>
      <div className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-md">
          <h1 className="text-center font-head text-3xl font-extrabold tracking-tight">
            Sign in
          </h1>
          <p className="mt-2 text-center text-muted-foreground">
            Welcome back to JobClubb.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-2">
            {ACCOUNT_TYPES.map(({ icon: Icon, label }, i) => (
              <button
                key={label}
                type="button"
                aria-pressed={i === 0}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border px-3 py-3 font-head text-xs font-semibold transition-colors aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-brand-foreground"
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <form className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="-my-1 py-1 text-xs text-brand hover:underline">
                  Forgot?
                </Link>
              </div>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>

            <Button
              type="submit"
              className="w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            >
              Sign in
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            New to JobClubb?{" "}
            <Link href="/sign-up" className="font-semibold text-brand hover:underline">
              Create an account
            </Link>
          </p>

          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            Company and franchise accounts are created by the JobClubb admin team and can
            sign in once approved.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
