import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Compass,
  LifeBuoy,
} from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Page not found — JobClubb",
};

const SUGGESTIONS = [
  {
    label: "Browse jobs",
    body: "See every live opening",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    label: "Companies",
    body: "Meet verified employers",
    href: "/companies",
    icon: Building2,
  },
  {
    label: "Membership",
    body: "Unlock one-click apply",
    href: "/membership",
    icon: BadgeCheck,
  },
  {
    label: "Contact us",
    body: "We're happy to help",
    href: "/contact",
    icon: LifeBuoy,
  },
];

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_top,black_30%,transparent_70%)] bg-size-[22px_22px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 size-120 -translate-x-1/2 rounded-full bg-brand/15 blur-3xl"
        />

        <section className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-card px-3 py-1 font-head text-xs font-bold tracking-[0.14em] text-brand uppercase shadow-sm">
            <Compass className="size-3.5" />
            Error 404
          </span>

          <p className="mt-6 bg-linear-to-br from-brand to-brand-accent bg-clip-text font-head text-8xl leading-none font-extrabold tracking-tighter text-transparent sm:text-9xl">
            404
          </p>

          <h1 className="mt-6 font-head text-3xl font-extrabold tracking-tight sm:text-4xl">
            Page not found
          </h1>
          <p className="mt-3 max-w-md leading-7 text-muted-foreground">
            The link may be broken, or the page has moved.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
              nativeButton={false}
              render={<Link href="/" />}
            >
              <ArrowLeft />
              Back to home
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-card font-head"
              nativeButton={false}
              render={<Link href="/jobs" />}
            >
              Browse jobs
            </Button>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6">
          <p className="text-center font-head text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
            Popular pages
          </p>
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SUGGESTIONS.map(({ label, body, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex h-full items-start gap-3 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
                >
                  <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 font-head text-sm font-bold">
                      {label}
                      <ArrowRight className="size-3.5 text-brand opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {body}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
