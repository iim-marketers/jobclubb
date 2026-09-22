import Image from "next/image";
import { redirect } from "next/navigation";
import { Check, Lock, LogOut, Sparkles } from "lucide-react";

import { signOut } from "@/app/(auth)/sign-in/actions";
import { choosePlan } from "@/app/(app)/onboarding/membership/actions";
import { PlanSubmit } from "@/components/plan-submit";
import {
  FRANCHISE_PRICE,
  FREE_FEATURES,
  MEMBER_FEATURES,
  MEMBERSHIP_PRICE,
  isMembershipPlan,
  plansFor,
} from "@/lib/membership";
import { cn } from "@/lib/utils";
import {
  CHOOSE_PLAN_PATH,
  requireCandidate,
} from "@/server/auth/current-candidate";

export const metadata = { title: "Choose your plan — JobClubb" };

export default async function ChoosePlanPage({
  searchParams,
}: PageProps<"/onboarding/membership">) {
  const candidate = await requireCandidate(CHOOSE_PLAN_PATH);
  if (isMembershipPlan(candidate.membership_plan))
    redirect("/candidate/dashboard");
  const { error } = await searchParams;
  const franchise = plansFor(candidate.code).includes("franchise");

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
            Welcome, {candidate.first_name}! Pick how you&apos;d like to start
          </h1>
          <p className="mt-3 text-muted-foreground">
            Start free and upgrade anytime, or become a member now to apply and
            get guaranteed interviews.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
          >
            We couldn&apos;t save your choice. Please try again.
          </p>
        )}

        <div
          className={cn(
            "mt-10 grid w-full items-stretch gap-5",
            franchise
              ? "max-w-6xl md:grid-cols-2 lg:grid-cols-3"
              : "max-w-4xl md:grid-cols-2",
          )}
        >
          <PlanOption
            plan="free"
            name="Free"
            price="₹0"
            cadence="forever"
            description="Explore the job board and set up your profile."
            features={FREE_FEATURES}
            locked={["Applying to jobs", "Guaranteed interviews"]}
            cta="Continue with Free"
          />
          <PlanOption
            plan="member"
            name="JobClubb Membership"
            price={MEMBERSHIP_PRICE}
            cadence="/ year"
            description="Everything you need to get hired, faster."
            features={MEMBER_FEATURES}
            cta={`Choose ${MEMBERSHIP_PRICE} plan`}
            badge={franchise ? undefined : "Recommended"}
          />
          {franchise && (
            <PlanOption
              plan="franchise"
              name="Franchise Membership"
              price={FRANCHISE_PRICE}
              cadence="/ year"
              description="Full membership at your partner's price."
              features={MEMBER_FEATURES}
              cta={`Choose ${FRANCHISE_PRICE} plan`}
              badge="Your franchise offer"
            />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          You can upgrade from Free to Membership anytime from your dashboard.
        </p>
      </main>
    </div>
  );
}

function PlanOption({
  plan,
  name,
  price,
  cadence,
  description,
  features,
  locked = [],
  cta,
  badge,
}: {
  plan: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  locked?: string[];
  cta: string;
  badge?: string;
}) {
  const highlighted = !!badge;

  return (
    <form
      action={choosePlan}
      className={cn(
        "relative flex flex-col rounded-3xl border bg-card p-7 sm:p-8",
        highlighted
          ? "border-brand shadow-xl shadow-brand/10 ring-1 ring-brand"
          : "border-border",
      )}
    >
      <input type="hidden" name="plan" value={plan} />
      {highlighted && (
        <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 font-head text-xs font-bold text-brand-foreground">
          <Sparkles className="size-3" /> {badge}
        </span>
      )}

      <h2 className="font-head text-lg font-bold tracking-tight">{name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <p className="mt-5 flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-head text-4xl font-extrabold tracking-tight",
            highlighted && "text-brand",
          )}
        >
          {price}
        </span>
        <span className="text-sm text-muted-foreground">{cadence}</span>
      </p>

      <ul className="mt-6 flex-1 space-y-3 border-t border-border pt-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 size-4 flex-none text-good" />
            {feature}
          </li>
        ))}
        {locked.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2.5 text-sm text-muted-foreground"
          >
            <Lock className="mt-0.5 size-4 flex-none" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <PlanSubmit highlighted={highlighted}>{cta}</PlanSubmit>
      </div>
    </form>
  );
}
