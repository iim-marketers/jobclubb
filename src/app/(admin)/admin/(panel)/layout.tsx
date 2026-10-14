import { cookies } from "next/headers";

import { AdminHeader, AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/server/admin/session";

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  const admin = createAdminClient();
  const [cookieStore, { count: offersToRelease }] = await Promise.all([
    cookies(),
    admin
      .from("placements")
      .select("id", { count: "exact", head: true })
      .eq("status", "offer_received"),
  ]);

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={cookieStore.get("sidebar_state")?.value !== "false"}>
        <AdminSidebar
          adminEmail={process.env.ADMIN_EMAIL ?? ""}
          offersToRelease={offersToRelease ?? 0}
        />
        <SidebarInset className="min-w-0">
          <AdminHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
