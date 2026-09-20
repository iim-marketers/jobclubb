import Link from "next/link";
import {
  Bell,
  Briefcase,
  FileText,
  Heart,
  LayoutDashboard,
  MapPin,
  Settings,
  Sparkles,
} from "lucide-react";

import { CompanyAvatar } from "@/components/company-avatar";
import { DashboardShell, Panel, StatCard, StatusPill } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { JOBS } from "@/lib/jobs-data";

export const metadata = { title: "Dashboard — JobClubb" };

const NAV = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, active: true },
  { label: "My applications", href: "/dashboard/applications", icon: Briefcase },
  { label: "Saved jobs", href: "/dashboard/saved", icon: Heart },
  { label: "My resume", href: "/dashboard/resume", icon: FileText },
  { label: "Membership", href: "/dashboard/membership", icon: Sparkles },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const APPLICATIONS = [
  { job: JOBS[0], status: "In review" as const, applied: "2 days ago" },
  { job: JOBS[1], status: "Approved" as const, applied: "1 week ago" },
  { job: JOBS[3], status: "Rejected" as const, applied: "3 weeks ago" },
];

export default function CandidateDashboard() {
  return (
    <DashboardShell
      role="Candidate"
      nav={NAV}
      title="Welcome back, Priya"
      subtitle="Here's where your job search stands."
      actions={
        <Button
          className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
          nativeButton={false}
          render={<Link href="/jobs" />}
        >
          Browse jobs
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Membership banner */}
        <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-linear-to-br from-brand-surface to-brand-surface-strong p-6 text-white">
          <Bell className="size-6 flex-none" />
          <div className="min-w-0 flex-1">
            <p className="font-head font-bold tracking-tight">
              Your membership expires in 15 days
            </p>
            <p className="mt-1 text-sm text-white/80">
              Renew now to keep full job access — and update your resume while
              you&apos;re here.
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-white font-head text-brand hover:bg-white/90">
              Renew now
            </Button>
            <Button
              variant="outline"
              className="border-white/40 bg-transparent font-head text-white hover:bg-white/10 hover:text-white"
            >
              Update resume
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Applications sent" value={12} tone="brand" />
          <StatCard label="In review" value={4} />
          <StatCard label="Interviews scheduled" value={2} tone="good" hint="of 3 guaranteed" />
          <StatCard label="Saved jobs" value={7} />
        </div>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Panel
            title="Recent applications"
            description="Your latest direct applications"
            actions={
              <Button variant="outline" size="sm" className="font-head">
                View all
              </Button>
            }
          >
            <ul className="divide-y divide-border">
              {APPLICATIONS.map(({ job, status, applied }) => (
                <li key={job.slug} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <CompanyAvatar name={job.company} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-head text-sm font-bold">{job.designation}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {job.company} · {job.location} · {applied}
                    </p>
                  </div>
                  <StatusPill status={status} />
                </li>
              ))}
            </ul>
          </Panel>

          <div className="min-w-0 space-y-6">
            <Panel title="ATS resume" description="AI-built, ATS-approved">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <FileText className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-head text-sm font-bold">Priya_Sharma_Resume.pdf</p>
                  <p className="text-xs text-muted-foreground">Updated 3 weeks ago</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex-1 bg-brand font-head text-brand-foreground hover:bg-brand-dark">
                  Regenerate
                </Button>
                <Button size="sm" variant="outline" className="flex-1 font-head">
                  Download
                </Button>
              </div>
            </Panel>

            <Panel title="Location match" description="Jobs near your home">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 flex-none text-brand" />
                <div>
                  <p className="text-sm font-medium">Kolkata, 700001</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Showing roles within 25 km of your saved address.
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="mt-4 w-full font-head">
                Change location
              </Button>
            </Panel>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
