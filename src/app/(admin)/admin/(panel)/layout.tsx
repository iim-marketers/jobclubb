import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AdminHeader, AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/server/admin/session";
import { countApplicationsToScreen } from "@/server/applications/screening";
import { countPendingChanges } from "@/server/companies/change-requests";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  const admin = createAdminClient();
  const [cookieStore, { count: offersToRelease }, changesToReview, applicationsToScreen] = await Promise.all([
    cookies(),
    admin
      .from("placements")
      .select("id", { count: "exact", head: true })
      .eq("status", "offer_received"),
    countPendingChanges(),
    countApplicationsToScreen(),
  ]);

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={cookieStore.get("sidebar_state")?.value !== "false"}>
        <AdminSidebar
          adminEmail={process.env.ADMIN_EMAIL ?? ""}
          offersToRelease={offersToRelease ?? 0}
          changesToReview={changesToReview}
          applicationsToScreen={applicationsToScreen}
        />
        <SidebarInset className="min-w-0">
          <AdminHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
