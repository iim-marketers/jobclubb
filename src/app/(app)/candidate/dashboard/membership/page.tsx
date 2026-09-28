import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  FileText,
  GraduationCap,
  LifeBuoy,
  Mail,
  Receipt,
  Send,
  Sparkles,
} from "lucide-react";

import { DashboardHeader, Panel } from "@/components/candidate/dashboard-ui";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { Button } from "@/components/ui/button";
import {
  APPLICATIONS,
  GUARANTEED_INTERVIEWS,
  INTERVIEWS,
} from "@/lib/candidate-activity";
import {
  MEMBERSHIP_DAYS,
  MEMBER_FEATURES,
  PLAN_DETAILS,
} from "@/lib/membership";
import { cn } from "@/lib/utils";
import { requireMember } from "@/server/auth/current-candidate";
import { getSavedResume } from "@/server/resume/ats-resume";

export const metadata = { title: "Membership — JobClubb" };

const RENEW_WINDOW_DAYS = 30;

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);

export default async function MembershipPage() {
  const candidate = await requireMember(`${CANDIDATE_HOME}/membership`);
  const resume = await getSavedResume(candidate.id);

  const plan = PLAN_DETAILS[candidate.membership_plan];
  const expiresAt = new Date(candidate.membership_expires_at);
  const startedAt = new Date(expiresAt);
  startedAt.setDate(startedAt.getDate() - MEMBERSHIP_DAYS);
  const daysLeft = Math.max(
    Math.ceil((expiresAt.getTime() - new Date().getTime()) / 86_400_000),
    0,
  );
  const renewSoon = daysLeft <= RENEW_WINDOW_DAYS;
  const interviewsUsed = INTERVIEWS.filter((i) => i.guaranteed).length;

  const perks = [
    {
      icon: Send,
      label: "One-click apply",
      value: `${APPLICATIONS.length} sent`,
      detail: "Unlimited",
      href: `${CANDIDATE_HOME}/applications`,
    },
    {
      icon: CalendarCheck,
      label: "Guaranteed interviews",
      value: `${interviewsUsed} of ${GUARANTEED_INTERVIEWS}`,
      detail: `${GUARANTEED_INTERVIEWS - interviewsUsed} remaining`,
      progress: interviewsUsed / GUARANTEED_INTERVIEWS,
      href: `${CANDIDATE_HOME}/interviews`,
    },
    {
      icon: FileText,
      label: "ATS resume",
      value: resume ? "Generated" : "Not yet",
      detail: resume
        ? `Targeting ${resume.targetRole}`
        : "Build yours in 2 minutes",
      href: `${CANDIDATE_HOME}/resume`,
    },
    {
      icon: GraduationCap,
      label: "Upskilling",
      value: "Coming soon",
      detail: "Certifications for your sector",
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Membership"
        description="Your plan, what it includes, and how much of it you've used."
      />

      <section
        aria-label="Your plan"
        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-surface to-brand-surface-strong p-6 text-white sm:p-7"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -bottom-28 size-80 rounded-full bg-brand-accent/20 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 font-head text-[11px] font-bold">
                <BadgeCheck className="size-3.5" /> Active
              </span>
              {candidate.code && (
                <span className="rounded-full border border-white/20 px-2.5 py-0.5 font-head text-[11px] font-bold tracking-wide">
                  Code {candidate.code}
                </span>
              )}
            </div>
            <p className="mt-3 font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
              {plan.name}
            </p>
            <p className="mt-1 text-sm text-white/80">
              {plan.price} for {MEMBERSHIP_DAYS} days · Member since{" "}
              {formatDate(startedAt)}
            </p>

            <div className="mt-6 max-w-md">
              <div className="flex items-baseline justify-between text-sm">
                <p className="font-head font-bold">
                  Valid till {formatDate(expiresAt)}
                </p>
                <p
                  className={cn(renewSoon ? "text-amber-200" : "text-white/75")}
                >
                  {daysLeft} days left
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-white"
                  style={{
                    width: `${Math.min(daysLeft / MEMBERSHIP_DAYS, 1) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-white/10 p-5 md:w-72 md:flex-none">
            <p className="font-head text-sm font-bold">
              {renewSoon ? "Renew to keep applying" : "Renewal"}
            </p>
            <p className="text-sm leading-6 text-white/80">
              {renewSoon
                ? `Your membership ends in ${daysLeft} days. Renew now so your applications and interviews aren't interrupted.`
                : `Renewal opens ${RENEW_WINDOW_DAYS} days before your plan ends. We'll email you a reminder.`}
            </p>
            {renewSoon && (
              <Button
                className="w-full bg-white font-head text-brand hover:bg-white/90"
                nativeButton={false}
                render={<Link href="/membership" />}
              >
                Renew membership <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Your perks">
        <h2 className="mb-4 font-head text-lg font-bold tracking-tight">
          Your perks
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {perks.map(({ icon: Icon, label, value, detail, progress, href }) => {
            const body = (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="size-4.5" />
                  </span>
                  {href && (
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                  )}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{label}</p>
                <p className="mt-0.5 font-head text-xl font-extrabold tracking-tight">
                  {value}
                </p>
                {progress !== undefined && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-good"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                )}
                <p className="mt-2 truncate text-xs text-muted-foreground">
                  {detail}
                </p>
              </>
            );
            const cls =
              "group block h-full rounded-2xl border border-border bg-card p-5 transition-colors";
            return (
              <li key={label}>
                {href ? (
                  <Link
                    href={href}
                    className={cn(cls, "hover:border-brand/40")}
                  >
                    {body}
                  </Link>
                ) : (
                  <div className={cn(cls, "border-dashed")}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel
          title="What's included"
          description="Everything your membership unlocks"
        >
          <ul className="grid gap-3 sm:grid-cols-2">
            {MEMBER_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex size-5 flex-none items-center justify-center rounded-full bg-good/12 text-good">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </Panel>

        <div className="min-w-0 space-y-6">
          <Panel title="Billing" description="Payments for your membership">
            <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
              <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Receipt className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-head text-sm font-bold">
                  {plan.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(startedAt)}
                </p>
              </div>
              <div className="flex-none text-right">
                <p className="font-head text-sm font-bold">{plan.price}</p>
                <p className="text-xs font-semibold text-good">Paid</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Need a GST invoice? Email us from your registered address and
              we&apos;ll send it within one working day.
            </p>
          </Panel>

          <section className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
            <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-brand-accent/15 text-good">
              <LifeBuoy className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-head font-bold tracking-tight">
                Priority support{" "}
                <Sparkles className="size-3.5 text-brand-accent" />
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Members get replies within 24 hours, until you&apos;re hired.
              </p>
              <a
                href="mailto:contact@jobclubb.com"
                className="mt-3 inline-flex items-center gap-1.5 font-head text-sm font-bold text-brand hover:text-brand-dark"
              >
                <Mail className="size-3.5" /> contact@jobclubb.com
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
