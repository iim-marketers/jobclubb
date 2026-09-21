import {
  Building2,
  CheckCheck,
  KeyRound,
  LayoutDashboard,
  Plus,
  Settings,
  Store,
  Users,
} from "lucide-react";

import { DashboardShell, Panel, StatCard, StatusPill } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const metadata = { title: "Admin — JobClubb" };

const NAV = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, active: true },
  { label: "Companies", href: "/admin/companies", icon: Building2 },
  { label: "Franchises", href: "/admin/franchises", icon: Store },
  { label: "Candidates", href: "/admin/candidates", icon: Users },
  { label: "Codes", href: "/admin/codes", icon: KeyRound },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

// SOP §4.4: companies on a corporate domain verify by email; free-mail or
// mismatched-domain sign-ups land here for manual review.
const APPROVALS = [
  { name: "Sea Breeze Cafe", type: "Company", email: "seabreezecafe.goa@gmail.com", verification: "Manual · GSTIN", status: "In review" as const },
  { name: "Pune West Franchise", type: "Franchise", email: "pune.west@jobclubb.com", verification: "Admin created", status: "In review" as const },
  { name: "Emirates — India Recruitment", type: "Company", email: "careers@emirates.com", verification: "Corporate email", status: "Approved" as const },
  { name: "Leela Kempinski", type: "Company", email: "hr@theleela.com", verification: "Corporate email", status: "Approved" as const },
];

const CODES = [
  { code: "JC-STU-7F2A", type: "Student", issuedTo: "IHM Kolkata", expires: "in 41 hours", status: "Active" as const },
  { code: "JC-STU-9K1B", type: "Student", issuedTo: "IHM Mumbai", expires: "in 12 hours", status: "Active" as const },
  { code: "JC-STU-3M8C", type: "Student", issuedTo: "Christ University", expires: "expired", status: "Inactive" as const },
];

export default function AdminDashboard() {
  return (
    <DashboardShell
      role="Platform admin"
      nav={NAV}
      title="Admin panel"
      subtitle="Approvals, account creation and code generation."
      actions={
        <Button className="bg-brand font-head text-brand-foreground hover:bg-brand-dark">
          <Plus className="size-4" />
          Create account
        </Button>
      }
    >
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Pending approvals" value={2} tone="brand" />
          <StatCard label="Active companies" value={34} />
          <StatCard label="Active franchises" value={11} />
          <StatCard label="Members this month" value={286} tone="good" />
        </div>

        <Panel
          title="Pending approvals"
          description="Companies and franchises can only sign in once approved"
          actions={
            <Button size="sm" variant="outline" className="font-head">
              <CheckCheck className="size-3.5" />
              Approve all
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-3 font-medium">Account</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Verification</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {APPROVALS.map((a) => (
                  <tr key={a.email}>
                    <td className="py-3 font-head font-bold">{a.name}</td>
                    <td className="py-3 text-muted-foreground">{a.type}</td>
                    <td className="py-3 font-mono text-xs text-muted-foreground">
                      {a.email}
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">{a.verification}</td>
                    <td className="py-3">
                      <StatusPill status={a.status} />
                    </td>
                    <td className="py-3 text-right">
                      {a.status === "In review" && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" className="bg-brand font-head text-brand-foreground hover:bg-brand-dark">
                            Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="font-head">
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Companies with 200+ employees must register with a corporate email address.
            Free-mail or mismatched-domain sign-ups need manual verification (GSTIN or
            business document) before approval.
          </p>
        </Panel>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_1.3fr]">
          <Panel title="Generate student code" description="Valid for 48 hours">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institution">Institution / issued to</Label>
                <Input id="institution" placeholder="IHM Kolkata" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Number of codes</Label>
                <Input id="quantity" type="number" defaultValue={1} min={1} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validity">Validity</Label>
                <Select
                  items={{ "48": "48 hours", "72": "72 hours" }}
                  defaultValue="48"
                >
                  <SelectTrigger id="validity" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="48">48 hours</SelectItem>
                    <SelectItem value="72">72 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
              >
                <KeyRound className="size-4" />
                Generate
              </Button>
            </form>
          </Panel>

          <Panel title="Recent codes" description="Student membership codes">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="pb-3 font-medium">Code</th>
                    <th className="pb-3 font-medium">Issued to</th>
                    <th className="pb-3 font-medium">Expires</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {CODES.map((c) => (
                    <tr key={c.code}>
                      <td className="py-3 font-mono text-xs font-semibold text-brand">
                        {c.code}
                      </td>
                      <td className="py-3 text-muted-foreground">{c.issuedTo}</td>
                      <td className="py-3 text-xs text-muted-foreground">{c.expires}</td>
                      <td className="py-3">
                        <StatusPill status={c.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  );
}
