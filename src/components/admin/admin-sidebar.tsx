"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LogOut, Users } from "lucide-react";

import { adminSignOut } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const ADMIN_NAV = [
  { label: "Companies", href: "/admin/companies", icon: Building2 },
  { label: "Candidates", href: "/admin/candidates", icon: Users },
] as const;

export function AdminSidebar({
  adminEmail,
  pendingReviews,
}: {
  adminEmail: string;
  pendingReviews: number;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center">
        <div className="flex items-center justify-between px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Link
            href="/admin/companies"
            aria-label="JobClubb admin"
            className="block overflow-hidden group-data-[collapsible=icon]:w-5.5"
          >
            <Image
              src="/brand/jobclubb-logo-dark.png"
              alt="JobClubb"
              width={130}
              height={24}
              className="h-5.5 w-auto max-w-none object-contain object-left"
            />
          </Link>
          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-head text-[10px] font-bold tracking-[0.14em] text-white/70 uppercase group-data-[collapsible=icon]:hidden">
            Admin
          </span>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-head tracking-[0.14em] text-sidebar-foreground/50 uppercase">
            Manage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {ADMIN_NAV.map(({ label, href, icon: Icon }) => {
                const active =
                  pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={label}
                      render={<Link href={href} />}
                      className="font-head font-medium text-sidebar-foreground/75 data-active:text-white [&_svg]:text-sidebar-foreground/60 data-active:[&_svg]:text-sidebar-primary"
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                    {href === "/admin/companies" && pendingReviews > 0 && (
                      <SidebarMenuBadge className="rounded-full bg-sidebar-primary px-1.5 font-bold text-sidebar-primary-foreground peer-hover/menu-button:text-sidebar-primary-foreground peer-data-active/menu-button:text-sidebar-primary-foreground">
                        {pendingReviews}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 group-data-[collapsible=icon]:hidden">
              <div className="min-w-0 flex-1">
                <p className="font-head text-xs font-bold text-white">
                  Platform admin
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {adminEmail}
                </p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={adminSignOut}>
              <SidebarMenuButton
                type="submit"
                tooltip="Sign out"
                className="text-sidebar-foreground/75 [&_svg]:text-sidebar-foreground/60"
              >
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export function AdminHeader() {
  const pathname = usePathname();
  const current = ADMIN_NAV.find((n) => pathname.startsWith(n.href));

  return (
    <header className="sticky top-0 z-10 flex h-16 flex-none items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
      <SidebarTrigger className="-ml-1" />
      <span aria-hidden className="mx-1 h-5 w-px bg-border" />
      <p className="text-sm text-muted-foreground">
        Admin
        {current && (
          <>
            <span className="mx-1.5 text-border">/</span>
            <span className="font-head font-semibold text-foreground">
              {current.label}
            </span>
          </>
        )}
      </p>
      <form action={adminSignOut} className="ml-auto">
        <Button type="submit" variant="outline" size="sm" className="font-head">
          <LogOut className="size-3.5" />
          Sign out
        </Button>
      </form>
    </header>
  );
}
