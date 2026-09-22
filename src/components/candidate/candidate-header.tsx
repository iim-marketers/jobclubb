"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  User,
} from "lucide-react";

import { signOut } from "@/app/(auth)/sign-in/actions";
import {
  SidebarContent,
  type CandidateProfile,
} from "@/components/candidate/candidate-sidebar";
import { CANDIDATE_HOME, activeNavItem } from "@/components/candidate/nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NOTIFICATIONS = [
  {
    title: "Interview scheduled with Taj",
    body: "Thu, 25 Sep · 11:00 AM · Video call",
    time: "1h",
    unread: true,
  },
  {
    title: "IndiGo viewed your application",
    body: "Cabin Crew Member · Kolkata",
    time: "5h",
    unread: true,
  },
  {
    title: "3 new Airlines roles near you",
    body: "Matched to your saved location",
    time: "1d",
    unread: false,
  },
];

const menuItemClass =
  "flex w-full cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-highlighted:bg-muted";

const popupClass =
  "origin-(--transform-origin) rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl shadow-black/5 transition-[transform,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0";

export function CandidateHeader({
  candidate,
  sidebarCollapsed,
  onToggleSidebar,
}: {
  candidate: CandidateProfile;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const current = activeNavItem(pathname);
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="-ml-1.5 lg:hidden"
                aria-label="Open menu"
              >
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
              candidate={candidate}
              onNavigate={() => setDrawerOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <Link
          href={CANDIDATE_HOME}
          className="flex-none lg:hidden"
          aria-label="JobClubb — dashboard"
        >
          <Image
            src="/brand/jobclubb-logo.png"
            alt="JobClubb"
            width={120}
            height={22}
            className="h-5 w-auto object-contain dark:hidden"
          />
          <Image
            src="/brand/jobclubb-logo-dark.png"
            alt=""
            aria-hidden
            width={120}
            height={22}
            className="hidden h-5 w-auto object-contain dark:block"
          />
        </Link>

        <Button
          variant="ghost"
          size="icon-sm"
          className="-ml-4 hidden text-muted-foreground lg:inline-flex"
          onClick={onToggleSidebar}
          aria-controls="candidate-sidebar"
          aria-expanded={!sidebarCollapsed}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={`${sidebarCollapsed ? "Expand" : "Collapse"} sidebar (⌘B)`}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="size-4.5" />
          ) : (
            <PanelLeftClose className="size-4.5" />
          )}
        </Button>

        <div className="hidden min-w-0 lg:block">
          <p className="font-head text-[11px] font-semibold tracking-wide text-muted-foreground">
            Dashboard <span className="mx-1 text-border">/</span>
            <span className="text-foreground">
              {current?.label ?? "Overview"}
            </span>
          </p>
        </div>

        <form
          action="/jobs"
          role="search"
          className="relative mx-auto hidden w-full max-w-md md:block"
        >
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            placeholder="Search roles, companies, cities…"
            aria-label="Search jobs"
            className="h-10 w-full rounded-full border border-border bg-card pr-4 pl-10 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-3 focus:ring-brand/15"
          />
        </form>

        <div className="ml-auto flex flex-none items-center gap-1 sm:gap-1.5 md:ml-0">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Search jobs"
            nativeButton={false}
            render={<Link href="/jobs" />}
          >
            <Search className="size-4.5" />
          </Button>

          <Button
            size="sm"
            className="mr-1 hidden bg-brand font-head text-brand-foreground hover:bg-brand-dark xl:inline-flex"
            nativeButton={false}
            render={<Link href="/jobs" />}
          >
            Browse jobs
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden sm:inline-flex"
            aria-label="Help"
            nativeButton={false}
            render={<a href="mailto:contact@jobclubb.com" />}
          >
            <CircleHelp className="size-4.5" />
          </Button>

          <MenuPrimitive.Root>
            <MenuPrimitive.Trigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="relative"
                  aria-label={`Notifications, ${unread} unread`}
                />
              }
            >
              <Bell className="size-4.5" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
              )}
            </MenuPrimitive.Trigger>
            <MenuPrimitive.Portal>
              <MenuPrimitive.Positioner
                align="end"
                sideOffset={8}
                className="z-50"
              >
                <MenuPrimitive.Popup
                  className={`${popupClass} w-[min(22rem,calc(100vw-2rem))]`}
                >
                  <div className="flex items-center justify-between px-2.5 pt-1.5 pb-2">
                    <p className="font-head text-sm font-bold">Notifications</p>
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 font-head text-[11px] font-bold text-brand">
                      {unread} new
                    </span>
                  </div>
                  {NOTIFICATIONS.map((n) => (
                    <MenuPrimitive.Item
                      key={n.title}
                      className={`${menuItemClass} items-start`}
                    >
                      <span
                        className={`mt-1.5 size-2 flex-none rounded-full ${n.unread ? "bg-brand" : "bg-transparent"}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {n.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {n.body}
                        </span>
                      </span>
                      <span className="flex-none text-[11px] text-muted-foreground">
                        {n.time}
                      </span>
                    </MenuPrimitive.Item>
                  ))}
                </MenuPrimitive.Popup>
              </MenuPrimitive.Positioner>
            </MenuPrimitive.Portal>
          </MenuPrimitive.Root>

          <MenuPrimitive.Root>
            <MenuPrimitive.Trigger
              className="ml-1 flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-2 pl-1 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted"
              aria-label="Account menu"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-linear-to-br from-brand to-brand-accent font-head text-[11px] font-extrabold text-white">
                {candidate.firstName[0]}
                {candidate.lastName[0]}
              </span>
              <span className="hidden font-head text-sm font-semibold sm:inline">
                {candidate.firstName}
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </MenuPrimitive.Trigger>
            <MenuPrimitive.Portal>
              <MenuPrimitive.Positioner
                align="end"
                sideOffset={8}
                className="z-50"
              >
                <MenuPrimitive.Popup className={`${popupClass} w-60`}>
                  <div className="px-2.5 pt-1.5 pb-2.5">
                    <p className="truncate font-head text-sm font-bold">
                      {candidate.firstName} {candidate.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {candidate.email}
                    </p>
                  </div>
                  <MenuPrimitive.Separator className="mx-1 my-1 h-px bg-border" />
                  <MenuPrimitive.LinkItem
                    className={menuItemClass}
                    closeOnClick
                    render={<Link href={`${CANDIDATE_HOME}/resume`} />}
                  >
                    <User className="size-4 text-muted-foreground" /> Profile &
                    resume
                  </MenuPrimitive.LinkItem>
                  <MenuPrimitive.LinkItem
                    className={menuItemClass}
                    closeOnClick
                    render={<Link href={`${CANDIDATE_HOME}/membership`} />}
                  >
                    <Sparkles className="size-4 text-muted-foreground" />{" "}
                    Membership
                  </MenuPrimitive.LinkItem>
                  <MenuPrimitive.LinkItem
                    className={menuItemClass}
                    closeOnClick
                    render={<Link href={`${CANDIDATE_HOME}/settings`} />}
                  >
                    <Settings className="size-4 text-muted-foreground" />{" "}
                    Settings
                  </MenuPrimitive.LinkItem>
                  <MenuPrimitive.Separator className="mx-1 my-1 h-px bg-border" />
                  <MenuPrimitive.Item
                    className={`${menuItemClass} text-destructive data-highlighted:bg-destructive/10`}
                    onClick={() => signOut()}
                  >
                    <LogOut className="size-4" /> Sign out
                  </MenuPrimitive.Item>
                </MenuPrimitive.Popup>
              </MenuPrimitive.Positioner>
            </MenuPrimitive.Portal>
          </MenuPrimitive.Root>
        </div>
      </div>
    </header>
  );
}
