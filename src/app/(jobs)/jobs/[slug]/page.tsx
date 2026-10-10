import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Check,
  CircleCheck,
  Clock,
  FileText,
  IndianRupee,
  Lock,
  MapPin,
  Monitor,
  ShieldCheck,
} from "lucide-react";

import { ApplyNowButton } from "@/components/apply-now-button";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { CompanyAvatar } from "@/components/company-avatar";
import { Button } from "@/components/ui/button";
import type { JobListing } from "@/lib/jobs-data";
import { toRichTextHtml } from "@/lib/rich-text";
import { cn } from "@/lib/utils";
import {
  getApplyState,
  type ApplyState,
} from "@/server/applications/candidate";
import {
  CHECKOUT_PATH,
  getCurrentCandidate,
  getJobAccess,
} from "@/server/auth/current-candidate";
import { getJob } from "@/server/jobs/listings";
import { sanitizeRichText } from "@/server/rich-text";

const BRAND_BUTTON =
  "bg-brand font-head text-brand-foreground hover:bg-brand-dark";

export default async function JobDetailPage({
  params,
}: PageProps<"/jobs/[slug]">) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  const access = await getJobAccess();
  const unlock = access.signedIn
    ? { href: CHECKOUT_PATH, label: "Complete payment to apply" }
    : { href: "/sign-up", label: "Join to apply" };
  const candidate = access.member ? await getCurrentCandidate() : null;
  const applyState = candidate ? await getApplyState(candidate.id, slug) : null;

  return (
    <section className="px-4 pt-6 pb-28 sm:px-6 lg:pb-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-brand"
        >
          <ArrowLeft className="size-4" />
          All jobs
        </Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-6">
            <JobHeader job={job} member={access.member} />
            {access.member ? (
              <JobBody job={job} />
            ) : (
              <LockedDetails unlock={unlock} />
            )}
          </div>

          <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5">
              {access.member && (
                <div className="mb-4 -mx-5 px-5 border-b border-border pb-4">
                  <p className="text-xs text-muted-foreground">Salary</p>
                  <p className="mt-0.5 font-head text-lg font-bold tracking-tight">
                    {job.salaryRange}
                  </p>
                </div>
              )}
              <ApplyButton slug={slug} state={applyState} unlock={unlock} />
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                One click sends your resume to the employer. Track every step
                from your dashboard.
              </p>
            </div>
            <PrivacyNote />
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          {access.member && (
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Salary</p>
              <p className="truncate font-head text-sm font-bold">
                {job.salaryRange}
              </p>
            </div>
          )}
          <ApplyButton
            slug={slug}
            state={applyState}
            unlock={unlock}
            className={access.member ? "w-auto" : "w-full"}
          />
        </div>
      </div>
    </section>
  );
}

function JobHeader({ job, member }: { job: JobListing; member: boolean }) {
  if (!member) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className="size-14 flex-none rounded-xl bg-muted blur-[5px]"
          />
          <div className="min-w-0 flex-1">
            <h1 className="font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
              {job.title}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Lock className="size-3.5 text-brand" />
              Company and details visible to members
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 ">
      <div className="flex items-start gap-4">
        <CompanyAvatar
          name={job.company}
          logoUrl={job.companyLogoUrl}
          className="size-14 rounded-xl text-base"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
              {job.designation}
            </h1>
            {job.featured && (
              <span className="rounded-full bg-brand-accent/15 px-2 py-0.5 font-head text-[10px] font-bold tracking-wide text-good uppercase">
                Featured
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {job.company} · {job.industry} · Posted{" "}
            {job.postedAgo.toLowerCase()}
          </p>
        </div>
      </div>

      <dl className="mt-5 -mx-5 px-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border pt-5 sm:grid-cols-4">
        <Fact icon={MapPin} label="Location" value={job.location} />
        <Fact icon={Briefcase} label="Experience" value={job.experience} />
        <Fact icon={IndianRupee} label="Salary" value={job.salaryRange} />
        <Fact
          icon={job.workMode === "WFH" ? Monitor : Clock}
          label="Job type"
          value={`${job.jobType} · ${job.workMode}`}
        />
      </dl>
    </div>
  );
}

function JobBody({ job }: { job: JobListing }) {
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card">
      <Section title="About the role">
        <div
          className="rich-text text-sm leading-7 text-muted-foreground"
          dangerouslySetInnerHTML={{
            __html: sanitizeRichText(toRichTextHtml(job.description)),
          }}
        />
      </Section>
      <Section title="Responsibilities">
        <CheckList items={job.responsibilities} />
      </Section>
      <Section title="Requirements">
        <CheckList items={job.requirements} />
      </Section>
      <Section title="Benefits">
        <ul className="flex flex-wrap gap-2">
          {job.benefits.map((benefit) => (
            <li
              key={benefit}
              className="rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground"
            >
              {benefit}
            </li>
          ))}
        </ul>
      </Section>
      <div className="p-5 sm:p-6 lg:hidden">
        <PrivacyNote />
      </div>
    </div>
  );
}

// Placeholder bars only: the real details are never sent to non-members.
function LockedDetails({
  unlock,
}: {
  unlock: { href: string; label: string };
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      <div aria-hidden className="space-y-6 p-6">
        {[4, 4, 3].map((lines, i) => (
          <div key={i} className="space-y-2.5">
            <div className="h-4 w-36 rounded-full bg-muted" />
            {Array.from({ length: lines }, (_, j) => (
              <div
                key={j}
                className="h-3 rounded-full bg-muted/70"
                style={{ width: `${95 - ((i + j) % 3) * 15}%` }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/75 px-6 text-center backdrop-blur-[2px]">
        <span className="flex size-11 items-center justify-center rounded-xl bg-brand/10">
          <Lock className="size-5 text-brand" />
        </span>
        <h2 className="mt-3 font-head text-lg font-bold tracking-tight">
          Job details are for members
        </h2>
        <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
          Members see the company, location, salary and full description, and
          apply in one click.
        </p>
        <Button
          className={cn("mt-5", BRAND_BUTTON)}
          nativeButton={false}
          render={<Link href={unlock.href} />}
        >
          {unlock.label}
        </Button>
      </div>
    </div>
  );
}

function ApplyButton({
  slug,
  state,
  unlock,
  className = "w-full",
}: {
  slug: string;
  state: ApplyState | null;
  unlock: { href: string; label: string };
  className?: string;
}) {
  if (state?.kind === "ready")
    return <ApplyNowButton slug={slug} className={cn(BRAND_BUTTON, className)} />;

  if (state?.kind === "applied")
    return (
      <Button
        variant="outline"
        className={cn("font-head", className)}
        nativeButton={false}
        render={
          <Link href={`${CANDIDATE_HOME}/applications/${state.ref}`} />
        }
      >
        <CircleCheck className="size-4 text-good" />
        Applied · View status
      </Button>
    );

  if (state?.kind === "no-resume")
    return (
      <Button
        className={cn(BRAND_BUTTON, className)}
        nativeButton={false}
        render={<Link href={`${CANDIDATE_HOME}/resume`} />}
      >
        <FileText className="size-4" />
        Build your resume to apply
      </Button>
    );

  return (
    <Button
      className={cn(BRAND_BUTTON, className)}
      nativeButton={false}
      render={<Link href={unlock.href} />}
    >
      {unlock.label}
    </Button>
  );
}

function PrivacyNote() {
  return (
    <div className="flex gap-3 rounded-2xl bg-muted/50 p-4">
      <ShieldCheck className="mt-0.5 size-4 flex-none text-brand" />
      <p className="text-xs leading-5 text-muted-foreground">
        Employers see your skills and experience first. Your name is shared
        only if they shortlist you, and your phone number and email are never
        shared.
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 sm:p-6">
      <h2 className="mb-3 font-head text-base font-bold tracking-tight">
        {title}
      </h2>
      {children}
    </div>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex text-sm gap-1 text-muted-foreground">
          <Check className="mt-1 size-4 flex-none text-brand" />
          <span className="leading-6">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {/* <Icon className="size-3.5" /> */}
        {label}
      </dt>
      <dd className="mt-1 font-head text-sm font-bold tracking-tight">
        {value}
      </dd>
    </div>
  );
}
