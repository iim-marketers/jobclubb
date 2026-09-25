import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { AtsInsights } from "@/components/resume/ats-insights";
import { ClearResumeButton } from "@/components/resume/clear-resume-button";
import { HowItWorks } from "@/components/resume/how-it-works";
import { PrintResumeButton } from "@/components/resume/print-resume-button";
import { ResumeBuilder } from "@/components/resume/resume-builder";
import { ResumeCard } from "@/components/resume/resume-card";
import { ResumeDocument } from "@/components/resume/resume-document";
import { ScoreHero } from "@/components/resume/score-hero";
import {
  atsReport,
  keywordScore,
  resumeToText,
  type ResumeContact,
} from "@/lib/resume";
import { VERTICALS } from "@/lib/taxonomy";
import { requireMember } from "@/server/auth/current-candidate";
import { getSavedResume } from "@/server/resume/ats-resume";

export const metadata = { title: "My resume — JobClubb" };

// Keyword extraction and resume generation are two model calls in one action.
export const maxDuration = 60;

export default async function ResumePage() {
  const candidate = await requireMember(`${CANDIDATE_HOME}/resume`);
  const vertical = VERTICALS.find((v) => v.slug === candidate.vertical);
  const saved = await getSavedResume(candidate.id);

  const contact: ResumeContact = {
    name: `${candidate.first_name} ${candidate.last_name}`,
    email: candidate.email,
    phone: candidate.phone,
    city: candidate.city,
  };
  const report = saved && atsReport(saved.resume, contact, saved.keywords);
  const keywordMatch =
    saved && keywordScore(resumeToText(saved.resume), saved.keywords);

  const builder = (
    <ResumeBuilder
      key={saved?.generatedAt ?? "new"}
      targetRole={saved?.targetRole ?? vertical?.roles[0] ?? ""}
      jobDescription={saved?.jobDescription ?? ""}
      roleSuggestions={vertical?.roles ?? []}
      hasResume={!!saved}
    />
  );

  if (!saved || !report) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <PageHeader />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <ResumeCard
            title="Build your ATS resume"
            description="Upload your current resume, describe your experience, or both."
          >
            {builder}
          </ResumeCard>
          <HowItWorks />
        </div>
      </div>
    );
  }

  const generated = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(saved.generatedAt));

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        action={
          <div className="flex items-center lg:pb-6 gap-2 print:hidden">
            <ClearResumeButton />
            <PrintResumeButton fileName={`${contact.name} - Resume`} />
          </div>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-6">
          <ScoreHero
            score={report.score}
            keywordMatch={keywordMatch ?? 0}
            originalScore={saved.originalScore}
            targetRole={saved.targetRole}
            tailored={!!saved.jobDescription}
            missing={report.missing.length}
          />

          <section className="min-w-0 rounded-3xl border border-border bg-card">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-5 sm:px-6 print:hidden">
              <h2 className="font-head font-bold tracking-tight">Preview</h2>
              <p className="text-xs text-muted-foreground">
                Generated {generated}
              </p>
            </div>
            <div className="p-3 sm:p-6">
              <ResumeDocument resume={saved.resume} contact={contact} />
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-6 print:hidden">
          <ResumeCard
            title="Tailor or refine"
            description="Tell us what to change, then regenerate."
          >
            {builder}
          </ResumeCard>

          <AtsInsights report={report} />
        </div>
      </div>
    </div>
  );
}

function PageHeader({ action }: { action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
          My resume
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Turn your current resume into a clean, ATS-friendly one that uses the
          keywords recruiters&apos; software screens for.
        </p>
      </div>
      {action}
    </div>
  );
}
