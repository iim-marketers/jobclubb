import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Check,
  CircleAlert,
  Clock,
  Download,
  FileText,
  Lock,
  MapPin,
  PartyPopper,
  Receipt,
  Video,
  X,
} from "lucide-react";

import { Salary } from "@/components/salary";
import { Panel } from "@/components/candidate/dashboard-ui";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import {
  DeclineOfferButton,
  PayOfferButton,
} from "@/components/candidate/offer-actions";
import { CompanyAvatar } from "@/components/company-avatar";
import { Button } from "@/components/ui/button";
import {
  STAGES,
  applicationStatus,
  formatInterviewDate,
  formatInterviewTime,
  offerEnded,
  type Application,
  type CandidateOffer,
} from "@/lib/candidate-activity";
import { interviewPhase } from "@/lib/interviews";
import { formatDateOnly, formatRupees } from "@/lib/placements";
import { toRichTextHtml } from "@/lib/rich-text";
import { NOT_SELECTED_BADGE, stageBadge } from "@/lib/status-badge";
import { cn } from "@/lib/utils";
import {
  getCandidateApplication,
  listCandidateInterviews,
} from "@/server/applications/candidate";
import { sanitizeRichText } from "@/server/rich-text";
import { listOfferDocuments } from "@/server/placements/documents";
import { getPlacementPaymentForCandidate } from "@/server/placements/payments";
import {
  getCurrentCandidate,
  requireMember,
} from "@/server/auth/current-candidate";

const APPLICATIONS_PATH = `${CANDIDATE_HOME}/applications`;

const NEXT_STEPS = [
  "Your application has been delivered. Most employers open new applications within 3 days, and you'll be notified the moment they do.",
  "The recruiter has seen your profile. Keep your resume up to date, since shortlisting usually happens within a week of the first view.",
  "You're on the shortlist. When the employer schedules an interview, the time and place show up here and on your Interviews page.",
  "Your interview is set. Use the prep checklist on the Interviews page and join 5 minutes early.",
];

function nextStep(a: Application) {
  if (!a.offer) return NEXT_STEPS[Math.min(a.stage, NEXT_STEPS.length - 1)];
  if (a.offer.status === "released")
    return `Pay the placement fee by ${formatDateOnly(a.offer.deadline)} to unlock your offer letter. If you'd rather not take the role, decline it at no cost so the employer can move on.`;
  if (a.offer.status === "accepted")
    return `Read your offer letter and keep the joining date, ${formatDateOnly(a.offer.joiningDate)}, free. Contact our placement team if anything in it looks wrong.`;
  return null;
}

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
  const candidate = await requireMember(`${APPLICATIONS_PATH}/${id}`, {
    allowLapsed: true,
  });
  const application = await getCandidateApplication(candidate.id, id);
  if (!application) notFound();

  const { job, offer } = application;
  const archived = application.status !== "active" || offerEnded(offer);
  const step = archived ? null : nextStep(application);
  const rejected = application.status === "rejected";
  const good = !archived && application.stage >= 3;
  const interviews = (await listCandidateInterviews(candidate.id)).filter(
    (i) => i.applicationId === application.id,
  );
  const now = new Date();

  return (
    <div className="space-y-6 ">
      <Link
        href={APPLICATIONS_PATH}
        className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All applications
      </Link>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start md:gap-x-5 md:gap-y-2">
          <CompanyAvatar
            name={job.company}
            logoUrl={job.companyLogoUrl}
            className="size-16 rounded-2xl text-lg md:row-span-2"
          />
          <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 font-head text-xs font-bold",
                stageBadge(application, archived),
              )}
            >
              {applicationStatus(application)}
            </span>
            <span className="font-head text-xs font-semibold text-muted-foreground">
              Application {application.id}
            </span>
          </div>
          <div className="col-span-2 min-w-0 md:col-span-1 md:col-start-2">
            <h1 className="font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
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
          {application.jobClosed ? (
            <Button
              variant="outline"
              className="col-span-2 font-head md:col-span-1 md:col-start-3 md:row-span-2 md:row-start-1"
              disabled
            >
              Job closed
            </Button>
          ) : (
            <Button
              variant="outline"
              className="col-span-2 font-head md:col-span-1 md:col-start-3 md:row-span-2 md:row-start-1"
              nativeButton={false}
              render={<Link href={`/jobs/${job.slug}`} />}
            >
              View job posting
            </Button>
          )}
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

      {offer && (
        <OfferSection
          offer={offer}
          designation={job.designation}
          companyName={job.company}
          candidateId={candidate.id}
          prefill={{
            name: `${candidate.first_name} ${candidate.last_name}`,
            email: candidate.email,
            contact: candidate.phone,
          }}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          {interviews.length > 0 && (
            <Panel
              title="Interviews for this role"
              action={
                !archived &&
                interviews.some(
                  (i) => interviewPhase(i, now) === "upcoming",
                ) && (
                  <Link
                    href={`${CANDIDATE_HOME}/interviews`}
                    className="inline-flex flex-none items-center gap-1 font-head text-sm font-bold whitespace-nowrap text-brand hover:text-brand-dark"
                  >
                    Prepare <ArrowUpRight className="size-3.5" />
                  </Link>
                )
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
                        Round {i.roundNo}: {i.round} ·{" "}
                        {formatInterviewDate(i.startsAt)},{" "}
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
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 font-head text-[11px] font-bold",
                          i.outcome === "Not selected"
                            ? NOT_SELECTED_BADGE
                            : "bg-muted text-muted-foreground",
                        )}
                      >
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
          {step && (
            <section className="rounded-3xl bg-linear-to-br from-brand-surface to-brand-surface-strong p-5 text-white sm:p-6">
              <p className="font-head text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase">
                What happens next
              </p>
              <p className="mt-2 text-sm leading-6 text-white/90">{step}</p>
            </section>
          )}

          <Panel title="Application details">
            <dl className="divide-y divide-border text-sm">
              {(
                [
                  ["Applied on", formatLongDate(application.appliedOn)],
                  ["Salary", <Salary key="salary" value={job.salaryRange} />],
                  ["Experience", job.experience],
                  ["Job type", job.jobType],
                  ["Work mode", job.workMode],
                  ["Location", `${job.location} ${job.pincode}`],
                ] as [string, React.ReactNode][]
              ).map(([label, value]) => (
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
                <li key={`${h.label}-${i}`} className="relative">
                  <span
                    className={cn(
                      "absolute top-1 -left-5 size-2.75 rounded-full ring-3 ring-card",
                      i === 0
                        ? rejected
                          ? "bg-destructive"
                          : archived
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

async function OfferSection({
  offer,
  designation,
  companyName,
  candidateId,
  prefill,
}: {
  offer: CandidateOffer;
  designation: string;
  companyName: string;
  candidateId: string;
  prefill: { name: string; email: string; contact: string };
}) {
  if (offer.status === "released")
    return (
      <section className="rounded-3xl border-2 border-good/40 bg-good/5 p-5 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-head text-xs font-bold tracking-[0.16em] text-good uppercase">
              <PartyPopper className="size-4" /> You&apos;ve been selected
            </p>
            <h2 className="mt-2 font-head text-xl font-extrabold tracking-tight sm:text-2xl">
              {companyName} has selected you for {designation}
            </h2>
            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                [
                  "Placement fee",
                  formatRupees(offer.fee),
                  "One month's fixed gross salary, GST included",
                ],
                [
                  "Pay by",
                  formatDateOnly(offer.deadline),
                  "The offer lapses after this date",
                ],
                [
                  "Expected joining",
                  formatDateOnly(offer.joiningDate),
                  "Confirmed in your offer letter",
                ],
              ].map(([label, value, hint]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-head text-lg font-extrabold">
                    {value}
                  </dd>
                  <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                    {hint}
                  </p>
                </div>
              ))}
            </dl>
            <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
              <Lock className="mt-1 size-3.5 flex-none" />
              <span>
                Your offer letter, salary details and joining instructions
                unlock as soon as you pay. The fee is non-refundable once paid,
                as set out in our{" "}
                <Link
                  href="/terms"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  terms
                </Link>
                .
              </span>
            </p>
          </div>
          <div className="space-y-2">
            <PayOfferButton
              placementId={offer.placementId}
              label={`Pay ${formatRupees(offer.fee)} & unlock offer`}
              jobTitle={`${designation} at ${companyName}`}
              prefill={prefill}
            />
            <DeclineOfferButton
              placementId={offer.placementId}
              companyName={companyName}
            />
          </div>
        </div>
      </section>
    );

  if (offer.status === "withdrawn" && offer.paid) {
    const payment = await getPlacementPaymentForCandidate(
      candidateId,
      offer.placementId,
    );
    return payment ? (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <Receipt className="size-4 flex-none" />
        Your placement fee invoice:
        <a
          href={`/api/invoices/${payment.paymentId}`}
          target="_blank"
          className="font-medium text-brand hover:text-brand-dark"
        >
          {payment.invoiceNumber}
        </a>
      </p>
    ) : null;
  }

  if (
    offer.status !== "accepted" &&
    offer.status !== "joined" &&
    offer.status !== "not_joined"
  )
    return null;

  const [documents, payment] = await Promise.all([
    listOfferDocuments(offer.placementId, { signed: true }),
    getPlacementPaymentForCandidate(candidateId, offer.placementId),
  ]);

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
      <p className="font-head text-xs font-bold tracking-[0.16em] text-good uppercase">
        {offer.status === "joined" ? "Hired" : "Offer accepted"}
      </p>
      <h2 className="mt-1 font-head text-xl font-extrabold tracking-tight">
        Your offer letter
      </h2>
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ul className="space-y-2">
          {documents.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-3 rounded-2xl border border-border p-3"
            >
              <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-brand/10 text-brand">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.max(1, Math.round(d.size / 1024))} KB
                </p>
              </div>
              {d.url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="font-head"
                  nativeButton={false}
                  render={<a href={d.url} />}
                >
                  <Download className="size-3.5" /> Download
                </Button>
              )}
            </li>
          ))}
        </ul>
        <dl className="divide-y divide-border text-sm">
          {[
            ["Joining date", formatDateOnly(offer.joiningDate)],
            offer.monthlySalary
              ? ["Monthly gross salary", formatRupees(offer.monthlySalary)]
              : null,
            ["Placement fee paid", formatRupees(payment?.amount ?? offer.fee)],
          ]
            .filter((row): row is string[] => !!row)
            .map(([label, value]) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          {payment && (
            <div className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">Invoice</dt>
              <dd>
                <a
                  href={`/api/invoices/${payment.paymentId}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 font-medium text-brand hover:text-brand-dark"
                >
                  <Receipt className="size-3.5" /> {payment.invoiceNumber}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
      {offer.notes && (
        <div className="mt-5 rounded-2xl bg-muted/50 p-4 text-sm leading-6">
          <p className="font-head text-xs font-bold text-muted-foreground">
            Joining instructions from the employer
          </p>
          <p className="mt-1 whitespace-pre-line">{offer.notes}</p>
        </div>
      )}
    </section>
  );
}

function StageStepper({ application: a }: { application: Application }) {
  const archived = a.status !== "active" || offerEnded(a.offer);
  const good = a.stage >= 3;
  const rejectedAt = a.status === "rejected" ? a.stage + 1 : -1;

  return (
    <ol
      aria-label="Application progress"
      className="mt-6 flex flex-col sm:mt-7 sm:grid sm:grid-cols-5 sm:pt-2"
    >
      {STAGES.map((stage, i) => {
        const reached = i <= a.stage;
        const current = i === a.stage && !archived;
        const rejected = i === rejectedAt;
        return (
          <li
            key={stage}
            aria-current={current || rejected ? "step" : undefined}
            className="relative flex min-w-0 items-center gap-3 py-1.5 sm:flex-col sm:gap-0 sm:py-0 sm:text-center"
          >
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute bottom-1/2 left-4 h-full w-0.5 -translate-x-1/2 sm:top-4 sm:right-1/2 sm:bottom-auto sm:left-auto sm:h-0.5 sm:w-full sm:translate-x-0 sm:-translate-y-1/2",
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
                rejected
                  ? "border-2 border-[color-mix(in_oklab,var(--color-destructive)_40%,var(--color-card))] bg-[color-mix(in_oklab,var(--color-destructive)_8%,var(--color-card))] text-destructive"
                  : !reached
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
              {rejected ? (
                <X className="size-4" strokeWidth={3} />
              ) : reached && !current ? (
                <Check className="size-4" strokeWidth={3} />
              ) : (
                i + 1
              )}
            </span>
            <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3 sm:block sm:w-full">
              <p
                className={cn(
                  "truncate font-head text-sm sm:mt-2 sm:px-1 sm:text-xs",
                  rejected
                    ? "font-bold text-destructive"
                    : current
                      ? "font-bold"
                      : "font-semibold text-muted-foreground",
                )}
              >
                {rejected ? "Not selected" : stage}
              </p>
              <p className="flex-none text-xs text-muted-foreground sm:text-[11px]">
                {rejected
                  ? a.history[a.history.length - 1].date
                  : reached
                    ? (a.stageDates[i] ?? "")
                    : "—"}
              </p>
            </div>
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
