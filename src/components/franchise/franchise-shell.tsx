"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CircleHelp, LogOut, Menu, UserPlus } from "lucide-react";

import { CompanyAvatar } from "@/components/company-avatar";
import { FRANCHISE_NAV } from "@/components/franchise/nav";
import { SignOutDialog } from "@/components/sign-out-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  FRANCHISE_HOME,
  FRANCHISE_REGISTER,
  FRANCHISE_SIGN_OUT_DESCRIPTION,
  FRANCHISE_STATUS_LABELS,
  type FranchiseStatus,
} from "@/lib/franchise";
import { cn } from "@/lib/utils";

const ITEMS = FRANCHISE_NAV.flatMap((g) => g.items);

// The most specific match wins, so /candidates/new highlights "Register a candidate".
function activeHref(pathname: string) {
  return ITEMS.map((i) => i.href)
    .filter((href) => pathname === href || (href !== FRANCHISE_HOME && pathname.startsWith(`${href}/`)))
    .sort((a, b) => b.length - a.length)[0];
}

export type FranchiseProfile = {
  name: string;
  code: string;
  email: string;
  status: FranchiseStatus;
};

export function FranchiseShell({
  franchise,
  children,
}: {
  franchise: FranchiseProfile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const current = ITEMS.find((i) => i.href === activeHref(pathname));
  const canRegister = franchise.status === "active";

  return (
    <div className="flex min-h-dvh flex-1 bg-background">
      <aside className="jc-sidebar sticky top-0 hidden h-dvh w-68 flex-none overflow-hidden text-white lg:flex">
        <SidebarContent franchise={franchise} pathname={pathname} onSignOut={() => setSignOutOpen(true)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon-sm" className="-ml-1.5 lg:hidden" aria-label="Open menu">
                    <Menu className="size-5" />
                  </Button>
                }
              />
              <SheetContent
                side="left"
                showCloseButton={false}
                className="jc-sidebar w-[min(18rem,86vw)] gap-0 border-0 p-0 text-white"
              >
                <SheetTitle className="sr-only">Dashboard menu</SheetTitle>
                <SidebarContent
                  franchise={franchise}
                  pathname={pathname}
                  onNavigate={() => setDrawerOpen(false)}
                  onSignOut={() => {
                    setDrawerOpen(false);
                    setSignOutOpen(true);
                  }}
                />
              </SheetContent>
            </Sheet>

            <p className="min-w-0 truncate font-head text-sm font-semibold">
              <span className="hidden text-muted-foreground sm:inline">
                Franchise dashboard <span className="mx-1 text-border">/</span>
              </span>
              {current?.label ?? "Overview"}
            </p>

            <div className="ml-auto flex flex-none items-center gap-1.5">
              {canRegister && (
                <Button
                  size="sm"
                  className="hidden bg-brand font-head text-brand-foreground hover:bg-brand-dark sm:inline-flex"
                  nativeButton={false}
                  render={<Link href={FRANCHISE_REGISTER} />}
                >
                  <UserPlus className="size-4" />
                  Register a candidate
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Email JobClubb head office"
                nativeButton={false}
                render={<a href="mailto:support@jobclubb.com" />}
              >
                <CircleHelp className="size-4.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Sign out"
                className="lg:hidden"
                onClick={() => setSignOutOpen(true)}
              >
                <LogOut className="size-4.5" />
              </Button>
            </div>
          </div>
        </header>
        <SignOutDialog
          open={signOutOpen}
          onOpenChange={setSignOutOpen}
          description={FRANCHISE_SIGN_OUT_DESCRIPTION}
        />
        {children}
      </div>
    </div>
  );
}

function SidebarContent({
  franchise,
  pathname,
  onNavigate,
  onSignOut,
}: {
  franchise: FranchiseProfile;
  pathname: string;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  const active = activeHref(pathname);
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex h-16 flex-none items-center justify-between px-5">
        <Link href="/" onClick={onNavigate} aria-label="JobClubb — home" className="block overflow-hidden">
          <Image
            src="/brand/jobclubb-logo-dark.png"
            alt="JobClubb"
            width={130}
            height={24}
            className="h-5.5 w-auto max-w-none object-contain object-left"
          />
        </Link>
        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-head text-[10px] font-bold tracking-[0.14em] text-white/70 uppercase">
          Franchise
        </span>
      </div>

      <nav aria-label="Dashboard" className="min-h-0 flex-1 overflow-y-auto px-3 pt-4 pb-6">
        {FRANCHISE_NAV.map((group) => (
          <div key={group.title} className="mb-6 last:mb-0">
            <p className="px-3 pb-2 font-head text-[10px] font-bold tracking-[0.16em] text-white/45 uppercase">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map(({ label, href, icon: Icon }) => {
                const isActive = href === active;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-2 rounded-xl px-2 py-2.5 font-head text-sm font-semibold text-white/70 transition-colors outline-none hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40",
                        isActive && "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]",
                      )}
                    >
                      {isActive && (
                        <span className="absolute top-2 bottom-2 -left-3 w-1 rounded-r-full bg-brand-accent" />
                      )}
                      <Icon
                        className={cn(
                          "size-4.5 flex-none transition-colors",
                          isActive ? "text-brand-accent" : "text-white/55 group-hover:text-white",
                        )}
                      />
                      <span className="flex-1 whitespace-nowrap">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex-none space-y-3 px-3 pb-4">
        <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
          <div className="flex items-center gap-3">
            <CompanyAvatar name={franchise.name} logoUrl={null} className="size-9 rounded-xl text-xs" />
            <div className="min-w-0">
              <p className="truncate font-head text-sm font-bold">{franchise.name}</p>
              <p className="mt-0.5 font-mono text-[11px] text-brand-accent">{franchise.code}</p>
            </div>
          </div>
          {franchise.status !== "active" && (
            <p className="mt-3 rounded-lg bg-white/8 px-2.5 py-1.5 text-[11px] text-white/75">
              {FRANCHISE_STATUS_LABELS[franchise.status]}: registering candidates is paused.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 rounded-2xl px-2 py-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-white/45">Signed in as</p>
            <p className="truncate text-xs text-white/75">{franchise.email}</p>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            onClick={onSignOut}
            className="flex size-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
