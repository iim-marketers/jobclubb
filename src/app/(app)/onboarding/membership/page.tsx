import Image from "next/image";
import { redirect } from "next/navigation";
import { Check, FlaskConical, LogOut, ShieldCheck } from "lucide-react";

import { signOut } from "@/app/(auth)/sign-in/actions";
import { payForMembership } from "@/app/(app)/onboarding/membership/actions";
import { PlanSubmit } from "@/components/plan-submit";
import {
  MEMBER_FEATURES,
  PLAN_DETAILS,
  isMembershipActive,
  planFor,
} from "@/lib/membership";
import {
  CHECKOUT_PATH,
  requireCandidate,
} from "@/server/auth/current-candidate";
import { paymentsTestMode } from "@/server/candidates/membership";

export const metadata = { title: "Complete your membership — JobClubb" };

const ERRORS: Record<string, string> = {
  unavailable:
    "Online payment isn't available yet. Please try again soon or contact us.",
  failed: "We couldn't activate your membership. Please try again.",
};

export default async function CheckoutPage({
  searchParams,
}: PageProps<"/onboarding/membership">) {
  const candidate = await requireCandidate(CHECKOUT_PATH);
  if (isMembershipActive(candidate.membership_expires_at))
    redirect("/candidate/dashboard");

  const { error } = await searchParams;
  const plan = planFor(candidate.code);
  const details = PLAN_DETAILS[plan];
  const franchise = plan === "franchise";

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-linear-to-b from-muted/70 to-background">
      <header className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Image
          src="/brand/jobclubb-logo.png"
          alt="JobClubb"
          width={130}
          height={24}
          priority
          className="h-5.5 w-auto object-contain dark:hidden"
        />
        <Image
          src="/brand/jobclubb-logo-dark.png"
          alt="JobClubb"
          width={130}
          height={24}
          priority
          className="hidden h-5.5 w-auto object-contain dark:block"
        />
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </form>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 pt-6 pb-16 sm:px-6 sm:pt-10">
        <div className="max-w-xl text-center">
          <p className="font-head text-sm font-semibold text-brand">
            Your email is verified
          </p>
          <h1 className="mt-2 font-head text-3xl font-extrabold tracking-tight sm:text-4xl">
            One last step, {candidate.first_name}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Activate your membership to see full job details, apply to employers
            and get your guaranteed interviews.
          </p>
        </div>

        {typeof error === "string" && ERRORS[error] && (
          <p
            role="alert"
            className="mt-6 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
          >
            {ERRORS[error]}
          </p>
        )}

        <div className="mt-10 grid w-full max-w-4xl items-start gap-5 md:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="rounded-3xl border border-border bg-card p-7 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-head text-lg font-bold tracking-tight">
                {details.name}
              </h2>
              {franchise && (
                <span className="rounded-full bg-brand-accent/15 px-2.5 py-0.5 font-head text-xs font-bold text-good">
                  Franchise price applied
                </span>
              )}
            </div>
            <p className="mt-4 flex flex-wrap items-baseline gap-2">
              <span className="font-head text-4xl font-extrabold tracking-tight text-brand">
                {details.price}
              </span>
              {franchise && (
                <span className="text-lg text-muted-foreground line-through">
                  {PLAN_DETAILS.member.price}
                </span>
              )}
              <span className="text-sm text-muted-foreground">/ year</span>
            </p>
            {franchise && (
              <p className="mt-2 text-sm text-muted-foreground">
                Because you joined with franchise code{" "}
                <span className="font-mono font-semibold whitespace-nowrap text-foreground">
                  {candidate.code}
                </span>
                .
              </p>
            )}

            <ul className="mt-6 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
              {MEMBER_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 size-4 flex-none text-good" />
                  {feature}
                </li>
              ))}
            </ul>
          </section>

          <aside className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-head font-bold tracking-tight">
              Order summary
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="text-right font-medium">{details.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Validity</dt>
                <dd className="font-medium">1 year</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-3">
                <dt className="font-head font-bold">Total</dt>
                <dd className="font-head text-lg font-extrabold">
                  {details.price}
                </dd>
              </div>
            </dl>

            <form action={payForMembership} className="mt-5">
              <PlanSubmit highlighted>Pay {details.price}</PlanSubmit>
            </form>
          </aside>
        </div>

        {paymentsTestMode ? (
          <p className="mt-5 flex max-w-4xl items-start gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-800 dark:text-amber-200">
            Test mode: no money is charged. Paying activates the membership
            straight away.
          </p>
        ) : (
          <p className="mt-5 flex max-w-4xl items-start gap-2 text-sm leading-6 text-muted-foreground">
            Paid securely via Razorpay. We&apos;ll remind you 15 days before it
            renews.
          </p>
        )}
      </main>
    </div>
  );
}
