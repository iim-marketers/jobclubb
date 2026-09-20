import {
  BadgeIndianRupee,
  LayoutDashboard,
  Plus,
  Settings,
  Upload,
  Users,
} from "lucide-react";

import { DashboardShell, Panel, StatCard, StatusPill } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Franchise dashboard — JobClubb" };

const NAV = [
  { label: "Overview", href: "/franchise/dashboard", icon: LayoutDashboard, active: true },
  { label: "My leads", href: "/franchise/dashboard/leads", icon: Users },
  { label: "Earnings", href: "/franchise/dashboard/earnings", icon: BadgeIndianRupee },
  { label: "Settings", href: "/franchise/dashboard/settings", icon: Settings },
];

/** SOP § Franchise Leads Onboarding */
const LEADS = [
  { name: "Ananya Ghosh", phone: "+91 90xxx xx210", sector: "Airlines", payment: "Paid" as const, review: "Approved" as const, added: "2 days ago" },
  { name: "Rahul Mehta", phone: "+91 98xxx xx884", sector: "Hotels", payment: "Paid" as const, review: "Approved" as const, added: "4 days ago" },
  { name: "Sanjana Iyer", phone: "+91 76xxx xx339", sector: "Travel & Tourism", payment: "Unpaid" as const, review: "In review" as const, added: "5 days ago" },
  { name: "Imran Sheikh", phone: "+91 88xxx xx017", sector: "Cruise Lines", payment: "Unpaid" as const, review: "In review" as const, added: "1 week ago" },
  { name: "Divya Nair", phone: "+91 70xxx xx552", sector: "Hotels", payment: "Unpaid" as const, review: "Rejected" as const, added: "2 weeks ago" },
];

export default function FranchiseDashboard() {
  return (
    <DashboardShell
      role="Franchise partner"
      nav={NAV}
      title="Kolkata South — Franchise"
      subtitle="Track the leads you've sent and the placements they've converted into."
      actions={
        <Button className="bg-brand font-head text-brand-foreground hover:bg-brand-dark">
          <Plus className="size-4" />
          Add lead
        </Button>
      }
    >
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Leads sent" value={48} tone="brand" />
          <StatCard label="Leads placed" value={19} tone="good" hint="40% conversion" />
          <StatCard label="In review" value={12} />
          <StatCard label="Rejected" value={5} tone="warn" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Profit share earned" value="₹1,42,500" tone="good" hint="50% of placement profit" />
          <StatCard label="Registrations collected" value="₹34,171" hint="₹1,199 × 29 leads" />
          <StatCard label="Pending payout" value="₹18,900" tone="brand" />
        </div>

        {/* Upload */}
        <Panel
          title="Upload leads"
          description="Add leads individually or import a spreadsheet"
        >
          <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-border bg-muted/40 p-7 text-center">
            <Upload className="mx-auto size-6 text-brand" />
            <div>
              <p className="font-head font-bold tracking-tight">
                Drop a CSV or click to upload
              </p>
              <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
                Include name, mobile, email, city and preferred sector. Leads can pay the
                ₹1,199 registration immediately, or you can capture their details and
                collect payment later.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" className="font-head">
                Choose file
              </Button>
              <Button variant="ghost" className="font-head">
                Download template
              </Button>
            </div>
          </div>
        </Panel>

        <Panel
          title="My leads"
          description="Paid leads receive login credentials by email automatically"
          actions={
            <Button size="sm" variant="outline" className="font-head">
              Export
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-3 font-medium">Lead</th>
                  <th className="pb-3 font-medium">Sector</th>
                  <th className="pb-3 font-medium">Registration</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {LEADS.map((lead) => (
                  <tr key={lead.name}>
                    <td className="py-3">
                      <p className="font-head font-bold">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                    </td>
                    <td className="py-3 text-muted-foreground">{lead.sector}</td>
                    <td className="py-3">
                      <StatusPill status={lead.payment} />
                    </td>
                    <td className="py-3">
                      <StatusPill status={lead.review} />
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">{lead.added}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Unpaid leads may be contacted by head office and converted directly. If that
            happens, the lead is removed from this dashboard.
          </p>
        </Panel>
      </div>
    </DashboardShell>
  );
}
