import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Check,
  CircleAlert,
  Clock,
  MapPin,
  Video,
} from "lucide-react";

import { Panel } from "@/components/candidate/dashboard-ui";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { CompanyAvatar } from "@/components/company-avatar";
import { Button } from "@/components/ui/button";
import {
  STAGES,
  applicationStatus,
  formatInterviewDate,
  formatInterviewTime,
  interviewsFor,
  type Application,
} from "@/lib/candidate-activity";
import { toRichTextHtml } from "@/lib/rich-text";
import { cn } from "@/lib/utils";
import { getCandidateApplication } from "@/server/applications/candidate";
import { sanitizeRichText } from "@/server/rich-text";
import {
  getCurrentCandidate,
  requireMember,
} from "@/server/auth/current-candidate";

const APPLICATIONS_PATH = `${CANDIDATE_HOME}/applications`;

const NEXT_STEPS = [
  "Your application has been delivered. Most employers open new applications within 3 days, and you'll be notified the moment they do.",
  "The recruiter has seen your profile. Keep your resume up to date, since shortlisting usually happens within a week of the first view.",
  "You're on the shortlist. When the employer proposes an interview time, JobClubb will contact you to confirm it before it's scheduled.",
  "Your interview is set. Use the prep checklist on the Interviews page and join 5 minutes early.",
  "Congratulations! Review the offer details and reply to the employer before the deadline they share.",
];

export async function generateMetadata({
  params,
}: PageProps<"/candidate/dashboard/applications/[id]">) {
  const candidate = await getCurrentCandidate();
  const application = candidate
    ? await getCandidateApplication(candidate.id, (await params).id)
    : null;
  return {
    title: application
      ? `${application.job.designation} at ${application.job.company} — JobClubb`
      : "Application — JobClubb",
  };
}

export default async function ApplicationDetailPage({
  params,
}: PageProps<"/candidate/dashboard/applications/[id]">) {
  const { id } = await params;
  const candidate = await requireMember(`${APPLICATIONS_PATH}/${id}`);
  const application = await getCandidateApplication(candidate.id, id);
  if (!application) notFound();

  const { job } = application;
  const archived = application.status !== "active";
  const good = !archived && application.stage >= 3;
  const interviews = interviewsFor(job.slug);

  return (
    <div className="space-y-6 ">
      <Link
        href={APPLICATIONS_PATH}
        className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All applications
      </Link>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <CompanyAvatar
            name={job.company}
            logoUrl={job.companyLogoUrl}
            className={cn(
              "size-16 rounded-2xl text-lg",
              archived && "opacity-60 grayscale",
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 font-head text-xs font-bold",
                  archived
                    ? "bg-muted text-muted-foreground"
                    : good
                      ? "bg-good/12 text-good"
                      : "bg-brand/10 text-brand",
                )}
              >
                {applicationStatus(application)}
              </span>
              <span className="font-head text-xs font-semibold text-muted-foreground">
                Application {application.id}
              </span>
            </div>
            <h1 className="mt-2 font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
              {job.designation}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" /> Updated{" "}
                {application.updatedAgo.toLowerCase()}
              </span>
            </p>
          </div>
          <Button
            variant="outline"
            className="flex-none font-head"
            nativeButton={false}
            render={<Link href={`/jobs/${job.slug}`} />}
          >
            View job posting <ArrowUpRight className="size-4" />
          </Button>
        </div>

        <StageStepper application={application} />

        <div
          className={cn(
            "mt-6 flex items-start gap-3 rounded-2xl p-4 text-sm",
            archived ? "bg-muted/70" : good ? "bg-good/8" : "bg-brand/6",
          )}
        >
          {archived ? (
            <CircleAlert className="mt-0.5 size-4 flex-none text-muted-foreground" />
          ) : (
            <span
              className={cn(
                "mt-1.5 size-2 flex-none rounded-full",
                good ? "bg-good" : "bg-brand",
              )}
            />
          )}
          <div className="min-w-0">
            <p className="font-head text-xs font-bold text-muted-foreground">
              Latest update · {application.updatedAgo}
            </p>
            <p className="mt-1 leading-6">{application.update}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          {interviews.length > 0 && (
            <Panel
              title="Interviews for this role"
              action={
                <Link
                  href={`${CANDIDATE_HOME}/interviews`}
                  className="inline-flex flex-none items-center gap-1 font-head text-sm font-bold whitespace-nowrap text-brand hover:text-brand-dark"
                >
                  Prepare <ArrowUpRight className="size-3.5" />
                </Link>
              }
            >
              <ul className="space-y-3">
                {interviews.map((i) => (
                  <li
                    key={i.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-border p-4"
                  >
                    <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <CalendarClock className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-head text-sm font-bold">
                        {i.round} · {formatInterviewDate(i.startsAt)},{" "}
                        {formatInterviewTime(i.startsAt)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Video className="size-3.5 flex-none" />
                        <span className="truncate">
                          {i.mode} · {i.interviewer}
                        </span>
                      </p>
                    </div>
                    {i.outcome && (
                      <span className="rounded-full bg-muted px-2.5 py-1 font-head text-[11px] font-bold text-muted-foreground">
                        {i.outcome}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="About the role" className="flex-1">
            <div
              className="rich-text mb-6 text-sm leading-7 text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: sanitizeRichText(toRichTextHtml(job.description)),
              }}
            />
            <div className="grid gap-6 sm:grid-cols-2">
              <DetailList
                title="Responsibilities"
                items={job.responsibilities}
              />
              <DetailList title="Requirements" items={job.requirements} />
            </div>
            {job.benefits.length > 0 && (
              <div className="mt-6 border-t border-border pt-5">
                <p className="font-head text-sm font-bold">Benefits</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {job.benefits.map((b) => (
                    <li
                      key={b}
                      className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {!archived && (
            <section className="rounded-3xl bg-linear-to-br from-brand-surface to-brand-surface-strong p-5 text-white sm:p-6">
              <p className="font-head text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase">
                What happens next
              </p>
              <p className="mt-2 text-sm leading-6 text-white/90">
                {NEXT_STEPS[application.stage]}
              </p>
            </section>
          )}

          <Panel title="Application details">
            <dl className="divide-y divide-border text-sm">
              {[
                ["Applied on", formatLongDate(application.appliedOn)],
                ["Salary", job.salaryRange],
                ["Experience", job.experience],
                ["Job type", job.jobType],
                ["Work mode", job.workMode],
                ["Location", `${job.location} ${job.pincode}`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Activity" className="flex-1">
            <ol className="relative space-y-4 pl-5">
              <span className="absolute top-1.5 bottom-1.5 left-1.25 w-px bg-border" />
              {[...application.history].reverse().map((h, i) => (
                <li key={h.label} className="relative">
                  <span
                    className={cn(
                      "absolute top-1 -left-5 size-2.75 rounded-full ring-3 ring-card",
                      i === 0
                        ? archived
                          ? "bg-muted-foreground"
                          : good
                            ? "bg-good"
                            : "bg-brand"
                        : "bg-border",
                    )}
                  />
                  <p
                    className={cn(
                      "text-sm",
                      i === 0 ? "font-head font-bold" : "text-muted-foreground",
                    )}
                  >
                    {h.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{h.date}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function StageStepper({ application: a }: { application: Application }) {
  const archived = a.status !== "active";
  const good = a.stage >= 3;

  return (
    <ol
      aria-label="Application progress"
      className="mt-7 grid grid-cols-5 pt-2"
    >
      {STAGES.map((stage, i) => {
        const reached = i <= a.stage;
        const current = i === a.stage && !archived;
        return (
          <li
            key={stage}
            aria-current={current ? "step" : undefined}
            className="relative flex min-w-0 flex-col items-center text-center"
          >
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2",
                  reached && !archived
                    ? good
                      ? "bg-good"
                      : "bg-brand"
                    : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-8 items-center justify-center rounded-full font-head text-xs font-extrabold",
                !reached
                  ? "border-2 border-border bg-card text-muted-foreground"
                  : archived
                    ? "bg-border text-muted-foreground"
                    : current
                      ? cn(
                          "text-white ring-4",
                          good
                            ? "bg-good ring-good/20"
                            : "bg-brand ring-brand/20",
                        )
                      : good
                        ? "bg-good text-white"
                        : "bg-brand text-white",
              )}
            >
              {reached && !current ? (
                <Check className="size-4" strokeWidth={3} />
              ) : (
                i + 1
              )}
            </span>
            <p
              className={cn(
                "mt-2 truncate px-1 font-head text-[11px] sm:text-xs",
                current ? "font-bold" : "font-semibold text-muted-foreground",
              )}
            >
              {stage}
            </p>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              {reached ? (a.history[i]?.date ?? "") : "—"}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-head text-sm font-bold">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-6">
            <span className="mt-2.5 size-1.5 flex-none rounded-full bg-brand" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatLongDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(isoDate));
}
