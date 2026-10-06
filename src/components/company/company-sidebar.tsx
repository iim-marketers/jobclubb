"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "@base-ui/react/tooltip";
import { LogOut, Plus, ShieldCheck } from "lucide-react";

import { RailTooltip } from "@/components/candidate/candidate-sidebar";
import { CompanyAvatar } from "@/components/company-avatar";
import { COMPANY_JOBS, COMPANY_NAV, isActive } from "@/components/company/nav";
import { SignOutDialog } from "@/components/sign-out-dialog";
import { cn } from "@/lib/utils";

export type CompanyProfile = {
  companyName: string;
  propertyName: string | null;
  contactName: string;
  email: string;
  sector?: string;
  city: string;
  logoUrl: string | null;
};

export const COMPANY_SIGN_OUT_DESCRIPTION =
  "You'll need to sign in again to manage your job postings and applicants.";

export function CompanySidebar({
  company,
  collapsed,
}: {
  company: CompanyProfile;
  collapsed: boolean;
}) {
  return (
    <aside
      id="company-sidebar"
      className={cn(
        "jc-sidebar sticky top-0 hidden h-dvh flex-none overflow-hidden text-white transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex",
        collapsed ? "w-18" : "w-68",
      )}
    >
      <Tooltip.Provider delay={100}>
        <CompanySidebarContent company={company} collapsed={collapsed} />
      </Tooltip.Provider>
    </aside>
  );
}

export function CompanySidebarContent({
  company,
  collapsed = false,
  onNavigate,
}: {
  company: CompanyProfile;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const displayName = company.propertyName ?? company.companyName;

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div
        className={cn(
          "flex h-16 flex-none items-center",
          collapsed ? "justify-center" : "justify-between px-5",
        )}
      >
        <Link
          href="/"
          onClick={onNavigate}
          aria-label="JobClubb — home"
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
            Employer
          </span>
        )}
      </div>

      <nav
        aria-label="Dashboard"
        className={cn(
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pb-6",
          !collapsed && "pt-4",
        )}
      >
        {COMPANY_NAV.map((group) => (
          <div key={group.title} className="mb-6 last:mb-0">
            {collapsed ? (
              <div className="mx-auto mb-3 h-px w-6 bg-white/15" />
            ) : (
              <p className="px-3 pb-2 font-head text-[10px] font-bold tracking-[0.16em] text-white/45 uppercase">
                {group.title}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map(({ label, href, icon: Icon }) => {
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
                          "group relative flex items-center gap-2 rounded-xl py-2.5 font-head text-sm font-semibold text-white/70 transition-colors outline-none hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40",
                          collapsed ? "justify-center px-0" : "px-2",
                          active &&
                            "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]",
                        )}
                      >
                        {active && (
                          <span className="absolute top-2 bottom-2 -left-3 w-1 rounded-r-full bg-brand-accent" />
                        )}
                        <Icon
                          className={cn(
                            "size-4.5 flex-none transition-colors",
                            active
                              ? "text-brand-accent"
                              : "text-white/55 group-hover:text-white",
                          )}
                        />
                        {!collapsed && (
                          <span className="flex-1 whitespace-nowrap">
                            {label}
                          </span>
                        )}
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
          <RailTooltip label="Post a job" enabled>
            <Link
              href={`${COMPANY_JOBS}/new`}
              aria-label="Post a job"
              className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-brand-accent transition-colors hover:bg-white/12"
            >
              <Plus className="size-4.5" />
            </Link>
          </RailTooltip>
          <RailTooltip label={displayName} enabled>
            <CompanyAvatar
              name={displayName}
              logoUrl={company.logoUrl}
              className="size-9 rounded-xl text-xs"
            />
          </RailTooltip>
        </div>
      ) : (
        <div className="flex-none space-y-3 px-3 pb-4">
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <div className="flex items-center gap-3">
              <CompanyAvatar
                name={displayName}
                logoUrl={company.logoUrl}
                className="size-9 rounded-xl text-xs"
              />
              <div className="min-w-0">
                <p className="truncate font-head text-sm font-bold">
                  {displayName}
                </p>
                <p className="flex items-center mt-0.5 text-[11px] text-brand-accent">
                  {/* <ShieldCheck className="size-3.5 flex-none" /> */}
                  Verified employer
                </p>
              </div>
            </div>
            <Link
              href={`${COMPANY_JOBS}/new`}
              onClick={onNavigate}
              className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-xl bg-white font-head text-sm font-semibold text-[#023b50] transition-colors hover:bg-white/90"
            >
              {/* <Plus className="size-4" /> */}
              Post a job
            </Link>
          </div>

          <div className="flex items-center gap-3 rounded-2xl px-2 py-1.5">
            <CompanyAvatar
              name={company.contactName}
              className="size-9 bg-linear-to-br from-brand-accent to-[#38b6dd] text-[#032a36]"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-head text-sm font-bold">
                {company.contactName}
              </p>
              <p className="truncate text-xs text-white/55">{company.email}</p>
            </div>
            <SignOutDialog
              description={COMPANY_SIGN_OUT_DESCRIPTION}
              render={
                <button
                  type="button"
                  aria-label="Sign out"
                  className="flex size-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
                />
              }
            >
              <LogOut className="size-4" />
            </SignOutDialog>
          </div>
        </div>
      )}
    </div>
  );
}
