import {
  Award,
  Briefcase,
  EyeOff,
  LayoutDashboard,
  Lock,
  Plus,
  Settings,
  Users,
} from "lucide-react";

import { DashboardShell, Panel, StatCard, StatusPill } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Company dashboard — JobClubb" };

const NAV = [
  { label: "Overview", href: "/company", icon: LayoutDashboard, active: true },
  { label: "Job postings", href: "/company/jobs", icon: Briefcase },
  { label: "Candidates", href: "/company/candidates", icon: Users },
  { label: "HR seats", href: "/company/seats", icon: Users },
  { label: "Rewards", href: "/company/rewards", icon: Award },
  { label: "Settings", href: "/company/settings", icon: Settings },
];

/** SOP §4.2 — companies see skills and experience only. No PII. */
const CANDIDATE_POOL = [
  { ref: "CAND-4821", experience: "3 years", vertical: "Airlines", skills: ["Cabin safety", "Guest handling", "English, Hindi"], match: "92%" },
  { ref: "CAND-4830", experience: "1 year", vertical: "Airlines", skills: ["Check-in systems", "Baggage handling", "English"], match: "87%" },
  { ref: "CAND-4844", experience: "5 years", vertical: "Hotels", skills: ["Front office", "Opera PMS", "Guest relations"], match: "84%" },
  { ref: "CAND-4851", experience: "2 years", vertical: "Hotels", skills: ["F&B service", "Banquets", "Upselling"], match: "79%" },
];

const SEATS = [
  { name: "Rakesh Nair", email: "r.nair@company.com", role: "HR Admin", status: "Active" as const },
  { name: "Anita Desai", email: "a.desai@company.com", role: "Recruiter", status: "Active" as const },
  { name: "Vikram Rao", email: "v.rao@company.com", role: "Recruiter", status: "Active" as const },
  { name: "Sneha Joshi", email: "s.joshi@company.com", role: "Recruiter", status: "Inactive" as const },
];

const POSTINGS = [
  { title: "Cabin Crew", location: "Kolkata, WB", type: "Full time", mode: "Field", applicants: 48, status: "Approved" as const },
  { title: "Ground Staff", location: "Bengaluru, KA", type: "Full time", mode: "Onsite", applicants: 31, status: "Approved" as const },
  { title: "Lounge Staff", location: "Hyderabad, TS", type: "Full time", mode: "Onsite", applicants: 0, status: "In review" as const },
];

export default function CompanyDashboard() {
  return (
    <DashboardShell
      role="Company"
      nav={NAV}
      title="IndiGo — Talent Acquisition"
      subtitle="Post openings and review candidates by capability."
      actions={
        <Button className="bg-brand font-head text-brand-foreground hover:bg-brand-dark">
          <Plus className="size-4" />
          Post a job
        </Button>
      }
    >
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active postings" value={8} tone="brand" />
          <StatCard label="Total applicants" value={164} />
          <StatCard label="HR seats used" value="3 / 5" hint="Slab: 5 seats" />
          <StatCard label="Reward points" value="1,240" tone="good" />
        </div>

        {/* Candidate pool — PII masked */}
        <Panel
          title="Candidate pool"
          description="Matched on skills and experience"
          actions={
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              <EyeOff className="size-3" />
              Identity hidden
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-3 font-medium">Reference</th>
                  <th className="pb-3 font-medium">Experience</th>
                  <th className="pb-3 font-medium">Sector</th>
                  <th className="pb-3 font-medium">Skills</th>
                  <th className="pb-3 font-medium">Match</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {CANDIDATE_POOL.map((c) => (
                  <tr key={c.ref}>
                    <td className="py-3 font-mono text-xs font-semibold">{c.ref}</td>
                    <td className="py-3 text-muted-foreground">{c.experience}</td>
                    <td className="py-3 text-muted-foreground">{c.vertical}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {c.skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 font-head font-bold text-good">{c.match}</td>
                    <td className="py-3 text-right">
                      <Button size="sm" variant="outline" className="font-head">
                        <Lock className="size-3" />
                        Unlock
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
            <EyeOff className="mt-0.5 size-3.5 flex-none" />
            Candidate name, contact details and photo stay hidden until you unlock a
            profile. Every unlock is logged and consumes a credit.
          </p>
        </Panel>

        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <Panel
            title="Job postings"
            actions={
              <Button size="sm" variant="outline" className="font-head">
                Manage
              </Button>
            }
          >
            <ul className="divide-y divide-border">
              {POSTINGS.map((p) => (
                <li key={p.title} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-head text-sm font-bold">{p.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.location} · {p.type} · {p.mode}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {p.applicants} applicants
                  </span>
                  <StatusPill status={p.status} />
                </li>
              ))}
            </ul>
          </Panel>

          {/* SOP §4.3 — seat management */}
          <Panel
            title="HR seats"
            description="3 of 5 seats in use"
            actions={
              <Button size="sm" variant="outline" className="font-head">
                Upgrade slab
              </Button>
            }
          >
            <ul className="divide-y divide-border">
              {SEATS.map((s) => (
                <li key={s.email} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-head text-sm font-bold">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.email} · {s.role}
                    </p>
                  </div>
                  <StatusPill status={s.status} />
                  <Button size="sm" variant="ghost" className="font-head text-xs">
                    {s.status === "Active" ? "Deactivate" : "Replace"}
                  </Button>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              At your seat limit? Deactivate a user to free a seat, then invite a
              replacement. Slabs available: 5 / 10 / 50, or a custom tier on request.
            </p>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  );
}
