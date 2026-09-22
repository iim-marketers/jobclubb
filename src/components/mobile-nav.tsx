"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  ChevronRight,
  Info,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Phone,
  Route,
  Settings,
  Sparkles,
  Store,
} from "lucide-react";

import { signOut } from "@/app/(auth)/sign-in/actions";
import { CANDIDATE_HOME, CANDIDATE_NAV } from "@/components/candidate/nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/jobs": Briefcase,
  "/companies": Building2,
  "/how-it-works": Route,
  "/membership": Sparkles,
  "/franchise": Store,
  "/about": Info,
};

const SHORTCUTS = CANDIDATE_NAV.flatMap((g) => g.items).filter((i) =>
  ["applications", "saved", "interviews", "resume"].some(
    (slug) => i.href === `${CANDIDATE_HOME}/${slug}`,
  ),
);

type SessionCandidate = { firstName: string; lastName: string; email: string };

export function MobileNav({
  links,
  candidate,
}: {
  links: { label: string; href: string }[];
  candidate: SessionCandidate | null;
}) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
        }
      />

      <SheetContent
        side="right"
        className="flex w-[min(21rem,88vw)] flex-col gap-0 p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <SheetClose
            nativeButton={false}
            render={
              <Link
                href="/"
                aria-label="JobClubb — home"
                className="flex items-center"
              >
                <Image
                  src="/brand/jobclubb-logo.png"
                  alt="JobClubb"
                  width={142}
                  height={26}
                  className="h-5.5 w-auto object-contain dark:hidden"
                />
                <Image
                  src="/brand/jobclubb-logo-dark.png"
                  alt=""
                  aria-hidden
                  width={142}
                  height={26}
                  className="hidden h-5.5 w-auto object-contain dark:block"
                />
              </Link>
            }
          />
          <SheetTitle className="sr-only">Menu</SheetTitle>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {candidate && <AccountSection candidate={candidate} />}

          <p className="px-2 pb-2 font-head text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
            Explore
          </p>

          <ul className="space-y-1">
            {links.map((link) => {
              const Icon = ICONS[link.href] ?? Briefcase;
              return (
                <li key={link.href}>
                  <SheetClose
                    nativeButton={false}
                    render={
                      <Link
                        href={link.href}
                        className="group flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-muted"
                      >
                        <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-muted text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                          <Icon className="size-4" />
                        </span>
                        <span className="flex-1 font-head text-sm font-semibold">
                          {link.label}
                        </span>
                        <ChevronRight className="size-4 flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                      </Link>
                    }
                  />
                </li>
              );
            })}
          </ul>

          {!candidate && (
            <div className="mt-5 overflow-hidden rounded-2xl bg-linear-to-br from-brand-surface to-brand-surface-strong p-5 text-white">
              <p className="font-head text-sm font-bold tracking-tight">
                Unlock the full job board
              </p>
              <p className="mt-1 text-xs leading-5 text-white/75">
                One-click apply, guaranteed interviews and upskilling included.
              </p>
              <SheetClose
                nativeButton={false}
                render={
                  <Button
                    size="sm"
                    className="mt-4 w-full bg-white font-head text-brand hover:bg-white/90"
                    nativeButton={false}
                    render={<Link href="/membership" />}
                  >
                    Become a Member
                  </Button>
                }
              />
            </div>
          )}
        </nav>

        <div className="border-t border-border px-5 py-4">
          {candidate ? (
            <div className="flex gap-2">
              <SheetClose
                nativeButton={false}
                render={
                  <Button
                    variant="outline"
                    className="flex-1 font-head"
                    nativeButton={false}
                    render={<Link href={`${CANDIDATE_HOME}/settings`} />}
                  >
                    <Settings className="size-4" />
                    Settings
                  </Button>
                }
              />
              <form action={signOut} className="flex-1">
                <Button
                  type="submit"
                  variant="destructive"
                  className="w-full font-head"
                >
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </form>
            </div>
          ) : (
            <SheetClose
              nativeButton={false}
              render={
                <Button
                  variant="outline"
                  className="w-full font-head"
                  nativeButton={false}
                  render={<Link href="/sign-in" />}
                >
                  Sign in
                </Button>
              }
            />
          )}

          <div className="mt-4 space-y-2">
            <a
              href="mailto:contact@jobclubb.com"
              className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-brand"
            >
              <Mail className="size-3.5 flex-none text-brand" />
              contact@jobclubb.com
            </a>
            <a
              href="tel:+919073933000"
              className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-brand"
            >
              <Phone className="size-3.5 flex-none text-brand" />
              +91 90739 33000
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AccountSection({ candidate }: { candidate: SessionCandidate }) {
  return (
    <div className="mb-6">
      <div className="jc-auth-panel relative isolate overflow-hidden rounded-2xl p-4 text-white">
        <div className="flex items-center gap-3">
          <span className="flex size-11 flex-none items-center justify-center rounded-full bg-white/15 font-head text-sm font-extrabold ring-2 ring-white/20">
            {candidate.firstName[0]}
            {candidate.lastName[0]}
          </span>
          <div className="min-w-0">
            <p className="truncate font-head font-bold tracking-tight">
              {candidate.firstName} {candidate.lastName}
            </p>
            <p className="truncate text-xs text-white/70">{candidate.email}</p>
          </div>
        </div>
        <SheetClose
          nativeButton={false}
          render={
            <Button
              size="sm"
              className="mt-4 w-full bg-white font-head text-brand hover:bg-white/90"
              nativeButton={false}
              render={<Link href={CANDIDATE_HOME} />}
            >
              <LayoutDashboard className="size-4" />
              Go to dashboard
            </Button>
          }
        />
      </div>

      {/* <ul className="mt-3 grid grid-cols-2 gap-2">
        {SHORTCUTS.map(({ label, href, icon: Icon, badge }) => (
          <li key={href}>
            <SheetClose
              nativeButton={false}
              render={
                <Link
                  href={href}
                  className="group relative flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-brand/40 hover:bg-muted"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="font-head text-sm font-semibold">
                    {label}
                  </span>
                  {badge ? (
                    <span className="absolute top-3 right-3 min-w-5 rounded-full bg-brand px-1.5 py-0.5 text-center text-[10px] leading-none font-bold text-brand-foreground">
                      {badge}
                    </span>
                  ) : null}
                </Link>
              }
            />
          </li>
        ))}
      </ul> */}
    </div>
  );
}
