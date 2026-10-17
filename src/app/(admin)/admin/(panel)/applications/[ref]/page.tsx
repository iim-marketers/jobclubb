import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";

import { ScreeningActions } from "@/components/admin/screening-actions";
import { InterviewControls } from "@/components/company/interview-actions";
import { ResumeDocument } from "@/components/resume/resume-document";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatExperienceMonths } from "@/lib/company-activity";
import { formatIst, interviewPhase } from "@/lib/interviews";
import { SCREENING_BADGES, SCREENING_LABELS } from "@/lib/screening";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/server/admin/session";
import { getScreeningApplication } from "@/server/applications/screening";

export const metadata = { title: "Application — JobClubb admin" };

const formatDate = (iso: string) => formatIst(iso, { day: "numeric", month: "short", year: "numeric" });
const formatDateTime = (iso: string) =>
  formatIst(iso, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const NEXT_STEP = {
  new: "Screen the profile, then schedule JobClubb's first-round interview (at the office or online).",
  interview: "Run the interview, then shortlist the candidate or mark them as not selected.",
  shortlisted: "Refer the candidate to the employer with JobClubb's assessment.",
  referred: "The employer is interviewing. Selection is at their discretion.",
  not_selected: null,
  closed: "The job closed before this candidate was referred.",
} as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="p-6">
      <h2 className="font-head text-sm font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-border rounded-2xl border border-border bg-card">{children}</div>;
}

function ContactLine({ icon: Icon, href, children }: { icon: typeof Mail; href?: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <Icon className="size-4 flex-none text-muted-foreground" />
      {href ? (
        <a href={href} className="min-w-0 break-all hover:text-brand">
          {children}
        </a>
      ) : (
        <span className="min-w-0">{children}</span>
      )}
    </li>
  );
}

export default async function AdminApplicationPage({ params }: PageProps<"/admin/applications/[ref]">) {
  await requireAdmin();
  const { ref } = await params;
  const a = await getScreeningApplication(ref);
  if (!a) notFound();

  const now = new Date();
  const interview = a.interview;
  const nextStep = NEXT_STEP[a.state];
  const statusLabel =
    a.state === "not_selected"
      ? `Not selected by ${a.rejectedBy === "employer" ? "employer" : "JobClubb"}`
      : SCREENING_LABELS[a.state];

  return (
    <div className="flex-1 space-y-8 px-4 py-6">
      <Link
        href="/admin/applications"
        className="mb-6 inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All applications
      </Link>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("font-head font-bold", SCREENING_BADGES[a.state])}>{statusLabel}</Badge>
              <span className="font-mono text-xs text-muted-foreground">{a.ref}</span>
            </div>
            <h1 className="mt-2 font-head text-2xl font-extrabold tracking-tight">{a.candidateName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {a.designation} at {a.companyName} · {formatExperienceMonths(a.experienceMonths)} · applied{" "}
              {formatDate(a.appliedOn)}
            </p>
          </div>
          <ScreeningActions applicationRef={a.ref} state={a.state} companyName={a.companyName} />
        </div>
        {nextStep && (
          <p className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">{nextStep}</p>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel>
          <Section title="JobClubb interview">
            {interview ? (
              <div className="space-y-4">
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">When</dt>
                    <dd className="mt-1 font-medium">
                      {formatDateTime(interview.startsAt)} IST · {interview.durationMins} min
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Round</dt>
                    <dd className="mt-1 font-medium">{interview.round}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{interview.mode}</dt>
                    <dd className="mt-1 font-medium break-words">
                      {interview.mode === "Video call" ? (
                        <a
                          href={interview.place}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-brand hover:underline"
                        >
                          Open link <ArrowUpRight className="size-3.5" />
                        </a>
                      ) : (
                        interview.place
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Interviewer</dt>
                    <dd className="mt-1 font-medium">{interview.interviewer}</dd>
                  </div>
                  {interview.outcome && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Result</dt>
                      <dd className="mt-1 font-medium">
                        {interview.outcome === "Cleared" ? "Shortlisted" : interview.outcome}
                      </dd>
                    </div>
                  )}
                </dl>
                {a.state === "interview" && (
                  <InterviewControls
                    applicantRef={a.ref}
                    jobLocation={null}
                    interview={interview}
                    phase={interviewPhase(interview, now)}
                    host="jobclubb"
                  />
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {a.state === "new"
                  ? "Not scheduled yet."
                  : "No JobClubb interview on record for this application."}
              </p>
            )}
          </Section>

          {a.referredAt && (
            <Section title="Referral">
              <p className="text-sm text-muted-foreground">
                Referred to {a.companyName} on {formatDate(a.referredAt)}.
              </p>
              {a.referralNote && (
                <p className="mt-3 rounded-2xl bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-line">
                  {a.referralNote}
                </p>
              )}
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">Employer interviews</p>
                {a.employerRounds.length === 0 ? (
                  <p className="mt-1.5 text-sm text-muted-foreground">None scheduled yet.</p>
                ) : (
                  <ol className="mt-1.5 space-y-1.5 text-sm">
                    {a.employerRounds.map((r) => (
                      <li key={r.roundNo} className="flex flex-wrap justify-between gap-x-4">
                        <span>
                          Round {r.roundNo}: {r.round}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDate(r.startsAt)} · {r.outcome ?? "Pending"}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              {a.placementId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 font-head"
                  nativeButton={false}
                  render={<Link href={`/admin/placements/${a.placementId}`} />}
                >
                  Open placement
                </Button>
              )}
            </Section>
          )}

          <Section title="Resume">
            <div className="-mx-2 rounded-2xl bg-muted/30 p-2 sm:p-4">
              <ResumeDocument
                resume={a.resume}
                contact={{
                  name: a.candidateName,
                  city: a.city,
                  email: a.candidateEmail,
                  phone: a.candidatePhone,
                }}
              />
            </div>
          </Section>
        </Panel>

        <Panel>
          <Section title="Candidate">
            <ul className="space-y-2.5 text-sm">
              <ContactLine icon={Mail} href={`mailto:${a.candidateEmail}`}>
                {a.candidateEmail}
              </ContactLine>
              <ContactLine icon={Phone} href={`tel:${a.candidatePhone}`}>
                {a.candidatePhone}
              </ContactLine>
              <ContactLine icon={MapPin}>{a.city}</ContactLine>
            </ul>
          </Section>
          <Section title="Job">
            <p className="text-sm font-medium">{a.designation}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {a.companyName} · {a.jobLocation.city} {a.jobLocation.pincode}
            </p>
          </Section>
        </Panel>
      </div>
    </div>
  );
}
