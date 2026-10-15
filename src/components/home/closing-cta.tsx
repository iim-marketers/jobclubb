import Link from "next/link";

import type { NonMemberView } from "@/components/home/shared";
import { Button } from "@/components/ui/button";
import { CHECKOUT_PATH } from "@/lib/membership";

export function ClosingCta({ view }: { view: NonMemberView }) {
  const primary = {
    guest: { label: "Become a Member", href: "/membership" },
    unpaid: {
      label:
        view.kind === "unpaid" && view.expired
          ? "Renew membership"
          : "Complete payment",
      href: CHECKOUT_PATH,
    },
  }[view.kind];

  return (
    <section className="bg-card px-4 py-12 md:py-16 sm:px-6">
      <div className="jc-auth-panel relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl px-5 py-12 sm:px-8 sm:py-14 text-center text-white shadow-lg">
        <h2 className="font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
          Looking for a career change?
        </h2>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-white/80">
          Browse our job listings, become a member, and let JobClubb get you
          hired faster.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            className="bg-white font-head text-brand hover:bg-white/90"
            nativeButton={false}
            render={<Link href={primary.href} />}
          >
            {primary.label}
          </Button>
          <Button
            variant="outline"
            className="border-white/40 bg-transparent font-head text-white hover:bg-white/10 hover:text-white"
            nativeButton={false}
            render={<Link href="/jobs" />}
          >
            Browse jobs
          </Button>
        </div>
      </div>
    </section>
  );
}
