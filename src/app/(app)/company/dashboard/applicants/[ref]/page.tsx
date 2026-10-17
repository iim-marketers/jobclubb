import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  ClipboardCheck,
  EyeOff,
  Handshake,
  MapPin,
  Phone,
  ShieldCheck,
  Video,
} from "lucide-react";

import { ApplicantActions } from "@/components/company/applicant-actions";
import { ReplacementTag } from "@/components/company/replacement-tag";
import { AccordionSections } from "@/components/accordion-sections";
import { InterviewControls } from "@/components/company/interview-actions";
import {
  ExitButton,
  JoiningButton,
  OfferButton,
} from "@/components/company/placement-actions";
import {
  COMPANY_APPLICANTS,
  COMPANY_SELECTED,
  applicantHref,
  jobApplicantsHref,
} from "@/components/company/nav";
import { Button } from "@/components/ui/button";
import { ResumeDocument } from "@/components/resume/resume-document";
import {
  formatInterviewDate,
  formatInterviewTime,
  formatShortDate,
  type InterviewMode,
} from "@/lib/candidate-activity";
import {
  STAGES,
  formatExperienceMonths,
  type CompanyInterview,
} from "@/lib/company-activity";
import { formatIst, interviewPhase, relativeDay } from "@/lib/interviews";
import {
  COMPANY_PLACEMENT_LABELS,
  LEFT_REASONS,
  formatDateOnly,
  isReleased,
  todayIst,
  type PlacementStatus,
} from "@/lib/placements";
import { cn } from "@/lib/utils";
import {
  NOT_SELECTED_BADGE,
  SELECTED_BADGE,
  stageBadge,
} from "@/lib/status-badge";
import { requireCompany } from "@/server/auth/current-company";
import { getCompanyApplicant } from "@/server/applications/company";
import { getCompanyPlacementForApplication } from "@/server/placements/placements";

const OFFER_NOTES: Record<PlacementStatus, string> = {
  awaiting_offer:
    "Upload their offer letter so JobClubb can share it with them.",
  offer_received:
    "JobClubb is reviewing the offer before sharing it with them.",
  released: "JobClubb has shared the offer and is waiting for them to confirm.",
  accepted:
    "They've confirmed the offer. Mark whether they joined after the joining date.",
  joined: "They've joined.",
  not_joined: "They didn't join.",
  expired: "They didn't confirm the offer in time, so it lapsed.",
  declined: "They declined the offer.",
  withdrawn: "The offer was withdrawn.",
};

export async function generateMetadata({
  params,
}: PageProps<"/company/dashboard/applicants/[ref]">) {
  const { ref } = await params;
  const company = await requireCompany(`${COMPANY_APPLICANTS}/${ref}`);
  const applicant = await getCompanyApplicant(company.id, ref);
  return {
    title: `${applicant?.name ?? applicant?.label ?? "Applicant"} — JobClubb`,
  };
}

export default async function ApplicantPage({
  params,
  searchParams,
}: PageProps<"/company/dashboard/applicants/[ref]">) {
  const [{ ref }, { section }] = await Promise.all([params, searchParams]);
  const company = await requireCompany(`${COMPANY_APPLICANTS}/${ref}`);
  const [applicant, placement] = await Promise.all([
    getCompanyApplicant(company.id, ref),
    getCompanyPlacementForApplication(company.id, ref),
  ]);
  if (!applicant) notFound();

  const rejected = applicant.status === "rejected";
  const latestRound = applicant.interviews.at(-1);
  const status = rejected
    ? "Not selected"
    : applicant.selected
      ? "Selected"
      : STAGES[applicant.stage];
  const now = new Date();
  const candidate = applicant.name ?? applicant.label;

  return (
    <div className="space-y-6">
      <Link
        href={jobApplicantsHref(applicant.jobId)}
        className="inline-flex max-w-full items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 flex-none" />
        <span className="truncate">{applicant.designation} applicants</span>
      </Link>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 font-head text-xs font-bold",
                  stageBadge(applicant),
                )}
              >
                {status}
              </span>
              <span className="font-mono text-xs font-semibold text-muted-foreground">
                {applicant.ref}
              </span>
              {applicant.replaces && (
                <ReplacementTag replaces={applicant.replaces} />
              )}
            </div>
            <h1 className="mt-2 flex items-center gap-2 font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
              {applicant.name ?? (
                <>
                  <EyeOff className="size-6 flex-none text-muted-foreground" />
                  {applicant.label}
                </>
              )}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {applicant.designation}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {applicant.city}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" /> Referred{" "}
                {formatShortDate(applicant.referredOn)}
              </span>
            </p>
          </div>
          {!rejected && !applicant.selected && applicant.stage < 4 && (
            <ApplicantActions
              applicantRef={applicant.ref}
              jobLocation={applicant.jobLocation}
              nextRound={applicant.nextRound}
            />
          )}
        </div>
      </section>

      {placement && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-good/12 text-good">
            <Handshake className="size-4" />
          </span>
          <p className="min-w-0 flex-1 basis-56 text-sm leading-6 text-muted-foreground">
            <span className="font-semibold text-foreground">
              Offer: {COMPANY_PLACEMENT_LABELS[placement.status]}.
            </span>{" "}
            {placement.left
              ? `${LEFT_REASONS[placement.left.reason]}, last working day ${formatDateOnly(placement.left.leftOn)}.`
              : OFFER_NOTES[placement.status]}
            {placement.replacement?.status === "owed" &&
              " JobClubb is finding a replacement candidate for you."}
            {placement.replacement?.status === "fulfilled" &&
              placement.replacement.ref && (
                <>
                  {" "}
                  JobClubb referred{" "}
                  <Link
                    href={applicantHref(placement.replacement.ref)}
                    className="font-semibold text-brand hover:underline"
                  >
                    {placement.replacement.candidate}
                  </Link>{" "}
                  as their replacement.
                </>
              )}
          </p>
          <div className="flex flex-wrap gap-2">
            {!isReleased(placement.status) && (
              <OfferButton
                placementId={placement.id}
                candidate={candidate}
                defaults={placement}
              />
            )}
            {placement.status === "accepted" &&
              placement.joiningDate &&
              placement.joiningDate <= todayIst() && (
                <JoiningButton
                  placementId={placement.id}
                  candidate={candidate}
                />
              )}
            {placement.status === "joined" &&
              !placement.left &&
              placement.joiningDate && (
                <ExitButton
                  placementId={placement.id}
                  candidate={candidate}
                  joiningDate={placement.joiningDate}
                  replaceable={!placement.isReplacement}
                />
              )}
            <Button
              variant="outline"
              size="sm"
              className="font-head"
              nativeButton={false}
              render={<Link href={COMPANY_SELECTED} />}
            >
              Manage offer
            </Button>
          </div>
        </div>
      )}

      <AccordionSections
        defaultOpen={
          section === "interview" && latestRound
            ? `round-${latestRound.roundNo}`
            : undefined
        }
        sections={[
          {
            value: "summary",
            title: "Profile summary",
            description: `${formatExperienceMonths(applicant.experienceMonths)} experience · ${applicant.skills.length} skills`,
            content: (
              <div className="p-5 sm:p-6">
                <dl className="grid grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">
                      Experience
                    </dt>
                    <dd className="mt-0.5 font-head text-sm font-bold">
                      {formatExperienceMonths(applicant.experienceMonths)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Skills</dt>
                    <dd className="mt-0.5 font-head text-sm font-bold">
                      {applicant.skills.length}
                    </dd>
                  </div>
                </dl>
                {applicant.referralNote && (
                  <div className="mt-5 rounded-2xl bg-muted/50 p-4 text-sm">
                    <p className="flex items-center gap-1.5 font-head font-bold">
                      <ClipboardCheck className="size-4 flex-none text-brand" />
                      JobClubb&apos;s assessment
                    </p>
                    <p className="mt-1.5 leading-6 whitespace-pre-line text-muted-foreground">
                      {applicant.referralNote}
                    </p>
                  </div>
                )}
                <div className="mt-5 flex items-start gap-1.5 rounded-2xl bg-muted/50 p-4 text-sm">
                  <ShieldCheck className="mt-1 size-4 flex-none text-brand" />
                  <p className="leading-6 text-muted-foreground">
                    JobClubb screened and interviewed this candidate before
                    referring them.
                    {applicant.jobClosed &&
                      " This posting is closed, but you can still review its applicants."}
                  </p>
                </div>
              </div>
            ),
          },
          ...applicant.interviews.map((i) => ({
            value: `round-${i.roundNo}`,
            title: `Round ${i.roundNo} interview`,
            description: `${i.round} · ${formatInterviewDate(i.startsAt)}, ${formatInterviewTime(i.startsAt)}`,
            badge: <InterviewStatus interview={i} now={now} />,
            content: (
              <InterviewPanel
                applicantRef={applicant.ref}
                jobLocation={applicant.jobLocation}
                interview={i}
                settled={rejected}
                now={now}
              />
            ),
          })),
          {
            value: "resume",
            title: "Resume",
            description: "View the applicant's resume",
            content: (
              <div className="bg-muted/30 p-3 sm:p-6">
                <ResumeDocument
                  resume={applicant.resume}
                  contact={{
                    name: applicant.name ?? applicant.label,
                    city: applicant.city,
                    email: "",
                    phone: "",
                  }}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

const MODE_ICONS: Record<InterviewMode, typeof Video> = {
  "Video call": Video,
  "In-person": MapPin,
  Phone: Phone,
};

const linkClass =
  "inline-flex items-center gap-1 font-head text-xs font-bold text-brand hover:text-brand-dark hover:underline";

function InterviewPanel({
  applicantRef,
  jobLocation,
  interview: i,
  settled,
  now,
}: {
  applicantRef: string;
  jobLocation: { city: string; pincode: string };
  interview: CompanyInterview;
  settled: boolean;
  now: Date;
}) {
  const phase = interviewPhase(i, now);
  const past = phase === "ended";
  const ends = new Date(
    new Date(i.startsAt).getTime() + i.durationMins * 60_000,
  ).toISOString();
  const ModeIcon = MODE_ICONS[i.mode];
  const open = !settled && !i.outcome;

  return (
    <div>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
        <div
          className={cn(
            "relative flex flex-none items-center gap-4 overflow-hidden rounded-2xl p-4 sm:w-36 sm:flex-col sm:justify-center sm:gap-0 sm:text-center",
            past
              ? "bg-muted text-muted-foreground"
              : "bg-linear-to-br from-brand-surface to-brand-surface-strong text-white",
          )}
        >
          {!past && (
            <span
              aria-hidden
              className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-white/10 blur-xl"
            />
          )}
          <div className="relative flex items-baseline gap-2 sm:flex-col sm:items-center sm:gap-0">
            <span className="font-head text-[11px] font-bold tracking-[0.16em] uppercase opacity-80">
              {formatIst(i.startsAt, { weekday: "short" })}
            </span>
            <span className="font-head text-4xl leading-none font-extrabold sm:mt-1">
              {formatIst(i.startsAt, { day: "numeric" })}
            </span>
            <span className="font-head text-sm font-bold sm:mt-1">
              {formatIst(i.startsAt, { month: "short", year: "numeric" })}
            </span>
          </div>
          <span
            className={cn(
              "relative ml-auto rounded-full px-2.5 py-1 font-head text-[11px] font-bold sm:mt-3 sm:ml-0",
              past ? "bg-card text-foreground" : "bg-white/15",
            )}
          >
            {formatInterviewTime(i.startsAt)}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-w-0">
            <h2 className="font-head text-xl font-extrabold tracking-tight">
              {i.round}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatInterviewTime(i.startsAt)} – {formatInterviewTime(ends)}{" "}
              IST · {i.durationMins} min
            </p>
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex min-w-0 gap-3 rounded-2xl bg-muted/50 p-3.5">
              <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-card text-brand shadow-xs">
                <ModeIcon className="size-4" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">{i.mode}</dt>
                <dd className="mt-0.5 text-sm font-medium break-words">
                  {i.mode === "Video call" ? (
                    <span className="block truncate">{i.place}</span>
                  ) : (
                    i.place
                  )}
                </dd>
                {i.venue?.landmark && (
                  <dd className="text-xs text-muted-foreground">
                    Landmark: {i.venue.landmark}
                  </dd>
                )}
                <dd className="mt-1.5">
                  {i.mode === "Video call" ? (
                    <a
                      href={i.place}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      Open link <ArrowUpRight className="size-3.5" />
                    </a>
                  ) : i.mode === "Phone" ? (
                    <span className="text-xs text-muted-foreground">
                      The applicant calls you on this number.
                    </span>
                  ) : (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(i.place)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      View on map <ArrowUpRight className="size-3.5" />
                    </a>
                  )}
                </dd>
              </div>
            </div>
            <div className="flex min-w-0 gap-3 rounded-2xl bg-muted/50 p-3.5">
              <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-card font-head text-xs font-extrabold text-brand shadow-xs">
                {initials(i.interviewer)}
              </span>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Interviewer</dt>
                <dd className="mt-0.5 text-sm font-medium break-words">
                  {i.interviewer}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t border-border bg-muted/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs leading-5 text-muted-foreground">
            {phase === "ended"
              ? "Record how it went so the applicant knows where they stand."
              : phase === "live"
                ? `In progress until ${formatInterviewTime(i.endsAt)}. If it ends early, mark it finished to record the result.`
                : "Changes show up on the applicant's dashboard straight away."}
          </p>
          <InterviewControls
            applicantRef={applicantRef}
            jobLocation={jobLocation}
            interview={i}
            phase={phase}
          />
        </div>
      )}
    </div>
  );
}

function InterviewStatus({
  interview: i,
  now,
}: {
  interview: CompanyInterview;
  now: Date;
}) {
  const phase = interviewPhase(i, now);
  const [label, tone] = i.outcome
    ? [
        i.outcome,
        i.outcome === "Not selected"
          ? NOT_SELECTED_BADGE
          : i.outcome === "Selected"
            ? SELECTED_BADGE
            : "bg-good/12 text-good",
      ]
    : phase === "ended"
      ? ["Result pending", "bg-amber-500/12 text-amber-700 dark:text-amber-300"]
      : phase === "live"
        ? ["Live now", "bg-good/12 text-good"]
        : [relativeDay(i.startsAt, now), "bg-brand/10 text-brand"];
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1 font-head text-xs font-bold",
        tone,
      )}
    >
      {phase === "live" && !i.outcome && <LiveDot />}
      {label}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function LiveDot() {
  return (
    <span className="relative flex size-2">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-good opacity-75 motion-reduce:hidden" />
      <span className="relative inline-flex size-2 rounded-full bg-good" />
    </span>
  );
}
