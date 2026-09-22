"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "@base-ui/react/tooltip";
import { ArrowUpRight, LogOut, Sparkles } from "lucide-react";

import { signOut } from "@/app/(auth)/sign-in/actions";
import { CANDIDATE_HOME, CANDIDATE_NAV, isActive } from "@/components/candidate/nav";
import { MEMBERSHIP_PRICE, type MembershipPlan } from "@/lib/membership";
import { cn } from "@/lib/utils";

export type CandidateProfile = {
  firstName: string;
  lastName: string;
  email: string;
  sector?: string;
  plan: MembershipPlan;
};

const PLAN_CARD = {
  free: {
    title: "Free plan",
    status: "Limited access",
    body: "Upgrade to apply to jobs and get 3 guaranteed interviews.",
    cta: `Upgrade · ${MEMBERSHIP_PRICE}/yr`,
    tooltip: "Free plan · Upgrade",
  },
  // TODO: show the active membership and renewal date once payments exist.
  member: {
    title: "JobClubb Membership",
    status: "Payment pending",
    body: "Complete your payment to unlock every member benefit.",
    cta: "Complete payment",
    tooltip: "Membership · Payment pending",
  },
  franchise: {
    title: "Franchise Membership",
    status: "Payment pending",
    body: "Complete your payment to unlock every member benefit.",
    cta: "Complete payment",
    tooltip: "Membership · Payment pending",
  },
} satisfies Record<MembershipPlan, Record<string, string>>;

export function CandidateSidebar({
  candidate,
  collapsed,
}: {
  candidate: CandidateProfile;
  collapsed: boolean;
}) {
  return (
    <aside
      id="candidate-sidebar"
      className={cn(
        "jc-sidebar sticky top-0 hidden h-dvh flex-none overflow-hidden text-white transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex",
        collapsed ? "w-18" : "w-68",
      )}
    >
      <Tooltip.Provider delay={100}>
        <SidebarContent candidate={candidate} collapsed={collapsed} />
      </Tooltip.Provider>
    </aside>
  );
}

function RailTooltip({
  label,
  enabled,
  children,
}: {
  label: string;
  enabled: boolean;
  children: React.ReactElement;
}) {
  if (!enabled) return children;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal>
        <Tooltip.Positioner side="right" sideOffset={12} className="z-50">
          <Tooltip.Popup className="rounded-lg bg-foreground px-2.5 py-1.5 font-head text-xs font-semibold text-background shadow-lg transition-opacity duration-100 data-ending-style:opacity-0 data-starting-style:opacity-0">
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function SidebarContent({
  candidate,
  collapsed = false,
  onNavigate,
}: {
  candidate: CandidateProfile;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const card = PLAN_CARD[candidate.plan];

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div
        className={cn(
          "flex h-16 flex-none items-center",
          collapsed ? "justify-center" : "justify-between px-5",
        )}
      >
        <Link
          href={CANDIDATE_HOME}
          onClick={onNavigate}
          aria-label="JobClubb — dashboard"
          className={cn("block overflow-hidden", collapsed && "w-5.5")}
        >
          <Image
            src="/brand/jobclubb-logo-dark.png"
            alt="JobClubb"
            width={130}
            height={24}
            className="h-5.5 w-auto max-w-none object-contain object-left"
          />
        </Link>
        {!collapsed && (
          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-head text-[10px] font-bold tracking-[0.14em] text-white/70 uppercase">
            Candidate
          </span>
        )}
      </div>

      <nav aria-label="Dashboard" className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pt-4 pb-6">
        {CANDIDATE_NAV.map((group) => (
          <div key={group.title} className="mb-6 last:mb-0">
            {collapsed ? (
              <div className="mx-auto mb-3 h-px w-6 bg-white/15" />
            ) : (
              <p className="px-3 pb-2 font-head text-[10px] font-bold tracking-[0.16em] text-white/45 uppercase">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ label, href, icon: Icon, badge }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <RailTooltip label={label} enabled={collapsed}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        aria-label={collapsed ? label : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl py-2.5 font-head text-sm font-semibold text-white/70 transition-colors outline-none hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40",
                          collapsed ? "justify-center px-0" : "px-3",
                          active && "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]",
                        )}
                      >
                        {active && (
                          <span className="absolute top-2 bottom-2 -left-3 w-1 rounded-r-full bg-brand-accent" />
                        )}
                        <Icon
                          className={cn(
                            "size-4.5 flex-none transition-colors",
                            active ? "text-brand-accent" : "text-white/55 group-hover:text-white",
                          )}
                        />
                        {!collapsed && <span className="flex-1 whitespace-nowrap">{label}</span>}
                        {badge ? (
                          collapsed ? (
                            <span className="absolute top-1.5 right-2.5 size-2 rounded-full bg-brand-accent ring-2 ring-[#023b50]" />
                          ) : (
                            <span className="min-w-5 rounded-full bg-brand-accent px-1.5 py-0.5 text-center text-[10px] leading-none font-bold text-[#032a36]">
                              {badge}
                            </span>
                          )
                        ) : null}
                      </Link>
                    </RailTooltip>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {collapsed ? (
        <div className="flex flex-none flex-col items-center gap-3 px-3 pb-4">
          <RailTooltip label={card.tooltip} enabled>
            <Link
              href={`${CANDIDATE_HOME}/membership`}
              aria-label={card.tooltip}
              className="relative flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-brand-accent transition-colors hover:bg-white/12"
            >
              <Sparkles className="size-4.5" />
              <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-amber-300 ring-2 ring-[#023b50]" />
            </Link>
          </RailTooltip>
          <RailTooltip label={`${candidate.firstName} ${candidate.lastName}`} enabled>
            <span className="flex size-9 items-center justify-center rounded-full bg-linear-to-br from-brand-accent to-[#38b6dd] font-head text-xs font-extrabold text-[#032a36]">
              {candidate.firstName[0]}
              {candidate.lastName[0]}
            </span>
          </RailTooltip>
        </div>
      ) : (
        <div className="flex-none space-y-3 px-3 pb-4">
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate font-head text-sm font-bold">{card.title}</p>
              <p className="flex-none text-xs text-amber-300">{card.status}</p>
            </div>
            <p className="mt-1.5 text-xs leading-5 text-white/60">{card.body}</p>
            <Link
              href={`${CANDIDATE_HOME}/membership`}
              onClick={onNavigate}
              className="mt-3 inline-flex items-center gap-1 font-head text-xs font-bold text-brand-accent hover:text-white"
            >
              {card.cta}
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-3 rounded-2xl px-2 py-1.5">
            <span className="flex size-9 flex-none items-center justify-center rounded-full bg-linear-to-br from-brand-accent to-[#38b6dd] font-head text-xs font-extrabold text-[#032a36]">
              {candidate.firstName[0]}
              {candidate.lastName[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-head text-sm font-bold">
                {candidate.firstName} {candidate.lastName}
              </p>
              <p className="truncate text-xs text-white/55">{candidate.email}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Sign out"
                className="flex size-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
