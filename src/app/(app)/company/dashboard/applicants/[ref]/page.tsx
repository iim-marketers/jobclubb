import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, EyeOff, MapPin, ShieldCheck } from "lucide-react";

import {
  ApplicantActions,
  MarkViewed,
} from "@/components/company/applicant-actions";
import { COMPANY_HOME } from "@/components/company/nav";
import { ResumeDocument } from "@/components/resume/resume-document";
import { formatShortDate } from "@/lib/candidate-activity";
import { STAGES, formatExperienceMonths } from "@/lib/company-activity";
import { cn } from "@/lib/utils";
import { requireCompany } from "@/server/auth/current-company";
import { getCompanyApplicant } from "@/server/applications/company";

const APPLICANTS_PATH = `${COMPANY_HOME}/applicants`;

export async function generateMetadata({
  params,
}: PageProps<"/company/dashboard/applicants/[ref]">) {
  const { ref } = await params;
  const company = await requireCompany(`${APPLICANTS_PATH}/${ref}`);
  const applicant = await getCompanyApplicant(company.id, ref);
  return { title: `${applicant?.name ?? applicant?.ref ?? "Applicant"} — JobClubb` };
}

export default async function ApplicantPage({
  params,
}: PageProps<"/company/dashboard/applicants/[ref]">) {
  const { ref } = await params;
  const company = await requireCompany(`${APPLICANTS_PATH}/${ref}`);
  const applicant = await getCompanyApplicant(company.id, ref);
  if (!applicant) notFound();

  const rejected = applicant.status === "rejected";
  const status = rejected ? "Not selected" : STAGES[applicant.stage];

  return (
    <div className="space-y-6">
      {applicant.stage === 0 && !rejected && <MarkViewed applicantRef={applicant.ref} />}

      <Link
        href={APPLICANTS_PATH}
        className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All applicants
      </Link>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 font-head text-xs font-bold",
                  rejected
                    ? "bg-muted text-muted-foreground"
                    : applicant.stage >= 2
                      ? "bg-good/12 text-good"
                      : "bg-brand/10 text-brand",
                )}
              >
                {status}
              </span>
              <span className="font-mono text-xs font-semibold text-muted-foreground">
                {applicant.ref}
              </span>
            </div>
            <h1 className="mt-2 flex items-center gap-2 font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
              {applicant.name ?? (
                <>
                  <EyeOff className="size-6 flex-none text-muted-foreground" />
                  Name hidden
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
                <CalendarDays className="size-3.5" /> Applied{" "}
                {formatShortDate(applicant.appliedOn)}
              </span>
            </p>
          </div>
          {!rejected && applicant.stage < 4 && (
            <ApplicantActions
              applicantRef={applicant.ref}
              canShortlist={applicant.stage < 2}
            />
          )}
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6">
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Experience</dt>
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

        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-muted/50 p-4 text-sm">
          <ShieldCheck className="mt-0.5 size-4 flex-none text-brand" />
          <p className="leading-6 text-muted-foreground">
            {applicant.name
              ? "You shortlisted this applicant, so their name is visible. Their phone number and email stay with JobClubb, which coordinates the interview."
              : "The name, phone number and email are hidden. Shortlist this applicant to see their name; contact details stay with JobClubb."}
            {applicant.jobClosed && " This posting is closed, but you can still review its applicants."}
          </p>
        </div>
      </section>

      <ResumeDocument
        resume={applicant.resume}
        contact={{
          name: applicant.name ?? applicant.ref,
          city: applicant.city,
          email: "",
          phone: "",
        }}
      />
    </div>
  );
}
