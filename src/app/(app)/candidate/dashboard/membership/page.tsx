import Link from "next/link";
import {
  ArrowRight,
  Check,
  Eye,
  FileText,
  LifeBuoy,
  Mail,
  Receipt,
} from "lucide-react";

import { DashboardHeader, Panel } from "@/components/candidate/dashboard-ui";
import { MembershipOverview } from "@/components/candidate/membership-overview";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { MEMBERSHIP_DAYS, PLAN_DETAILS } from "@/lib/membership";
import { cn } from "@/lib/utils";
import { requireMember } from "@/server/auth/current-candidate";
import { getSavedResume } from "@/server/resume/ats-resume";

export const metadata = { title: "Membership — JobClubb" };

const SUPPORT_EMAIL = "contact@jobclubb.com";

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
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

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Membership"
        description="Your plan, what it unlocks, and how much of it you've used."
      />

      <MembershipOverview
        name={`${candidate.first_name} ${candidate.last_name}`}
        planName={plan.name}
        franchise={candidate.membership_plan === "franchise"}
        price={plan.price}
        code={candidate.code}
        startedAt={startedAt}
        expiresAt={expiresAt}
        daysLeft={daysLeft}
      />

      <section aria-labelledby="benefits-heading">
        <div className="mb-4">
          <h2
            id="benefits-heading"
            className="font-head text-lg font-bold tracking-tight"
          >
            Your benefits
          </h2>
          <p className="text-sm text-muted-foreground">
            Everything your membership unlocks, and where you stand on each.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <BenefitCard
            icon={FileText}
            title="AI-built ATS resume"
            description={
              resume
                ? `Tailored for ${resume.targetRole}.`
                : "Generate a resume that clears applicant tracking systems."
            }
            href={`${CANDIDATE_HOME}/resume`}
            cta={resume ? "View resume" : "Build resume"}
          >
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-head text-xs font-bold",
                resume
                  ? "bg-good/12 text-good"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {resume && <Check className="size-3" strokeWidth={3} />}
              {resume ? "Generated" : "Not generated yet"}
            </span>
          </BenefitCard>

          <BenefitCard
            icon={Eye}
            title="Full job details"
            description="Salary, employer info and contact details on every listing."
            href="/jobs"
            cta="Browse jobs"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-good/12 px-2.5 py-1 font-head text-xs font-bold text-good">
              <Check className="size-3" strokeWidth={3} /> Unlocked
            </span>
          </BenefitCard>

          <BenefitCard
            icon={LifeBuoy}
            title="Priority support"
            description="Replies within 24 hours, until you're hired."
            href={`mailto:${SUPPORT_EMAIL}`}
            cta="Email support"
          >
            <p className="flex items-center gap-1.5 truncate text-sm font-medium">
              <Mail className="size-3.5 flex-none text-muted-foreground" />
              {SUPPORT_EMAIL}
            </p>
          </BenefitCard>
        </div>
      </section>

      <Panel title="Billing" description="Your plan and payment history">
        <div className="grid gap-6 md:grid-cols-2">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <Detail label="Plan" value={plan.name} />
            <Detail label="Price" value={`${plan.price} / year`} />
            <Detail label="Started" value={formatDate(startedAt)} />
            <Detail label="Valid till" value={formatDate(expiresAt)} />
            {candidate.code && (
              <Detail label="Sign-up code" value={candidate.code} />
            )}
          </dl>

          <div className="min-w-0">
            <p className="mb-2 text-xs text-muted-foreground">Payments</p>
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
              Need a GST invoice? Email{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-semibold text-brand hover:text-brand-dark"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              from your registered address and we&apos;ll send it within one
              working day.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  description,
  href,
  cta,
  className,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  cta: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "flex min-w-0 flex-col rounded-3xl border border-border bg-card p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-head font-bold tracking-tight">{title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5 flex-1">{children}</div>
      <Link
        href={href}
        className="group mt-4 inline-flex items-center gap-1 self-start font-head text-sm font-bold text-brand hover:text-brand-dark"
      >
        {cta}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate font-head font-bold">{value}</dd>
    </div>
  );
}
