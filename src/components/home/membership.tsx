import Link from "next/link";
import { Check } from "lucide-react";

import type { NonMemberView } from "@/components/home/shared";
import { SectionEyebrow } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { MEMBERSHIP_FEATURES, MEMBERSHIP_POINTS } from "@/lib/home-data";
import { CHECKOUT_PATH, PLAN_DETAILS } from "@/lib/membership";
import { cn } from "@/lib/utils";

export function Membership({ view }: { view: NonMemberView }) {
  const plan = view.kind === "guest" ? "member" : view.plan;
  const details = PLAN_DETAILS[plan];
  const card = {
    guest: {
      badge: "Most popular",
      cta: "Join JobClubb now",
      href: "/sign-up",
      note: "One year of membership. Renewal reminder before it ends.",
    },
    unpaid:
      view.kind === "unpaid" && view.expired
        ? {
            badge: "Membership expired",
            cta: `Renew for ${details.price}`,
            href: CHECKOUT_PATH,
            note: "Renew to unlock jobs, applying and guaranteed interviews again.",
          }
        : {
            badge: "Payment pending",
            cta: `Pay ${details.price} to activate`,
            href: CHECKOUT_PATH,
            note: "Activate to unlock jobs, applying and guaranteed interviews.",
          },
  }[view.kind];

  return (
    <section className="px-4 py-12 md:py-16 sm:px-6">
      <div className="mx-auto grid grid-cols-1 max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionEyebrow>Why JobClubb membership</SectionEyebrow>
          <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your days of job searching are over
          </h2>

          <ul className="mt-7 space-y-4">
            {MEMBERSHIP_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 flex-none items-center justify-center rounded-full bg-brand-accent/15">
                  <Check className="size-3 text-good" />
                </span>
                <span className="text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-3xl border border-border bg-card p-8 shadow-lg">
          <span
            className={cn(
              "absolute -top-3 left-8 rounded-full px-3 py-1 font-head text-xs font-bold",
              view.kind === "unpaid"
                ? "bg-amber-500 text-white"
                : "bg-brand text-brand-foreground",
            )}
          >
            {card.badge}
          </span>

          <h3 className="font-head text-lg font-bold tracking-tight">
            {details.name}
          </h3>

          <p className="mt-4 flex flex-wrap items-baseline gap-2">
            <span className="font-head text-4xl font-extrabold tracking-tight text-brand">
              {details.price}
            </span>
            {plan === "franchise" && (
              <span className="text-lg text-muted-foreground line-through">
                {PLAN_DETAILS.member.price}
              </span>
            )}
            <span className="text-sm text-muted-foreground">/ year</span>
          </p>

          <ul className="mt-6 space-y-3">
            {MEMBERSHIP_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 size-4 flex-none text-good" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            className="mt-7 w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href={card.href} />}
          >
            {card.cta}
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            {card.note}
          </p>
        </div>
      </div>
    </section>
  );
}
