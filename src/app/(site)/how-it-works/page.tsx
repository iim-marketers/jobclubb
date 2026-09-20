import Link from "next/link";
import { Check } from "lucide-react";

import { PageHeader, Section, SectionEyebrow } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { SOURCING_CHANNELS } from "@/lib/taxonomy";

export const metadata = {
  title: "How it works — JobClubb",
  description: "From free sign-up to your first day — how JobClubb gets you hired.",
};

const STEPS = [
  {
    step: "01",
    title: "Sign up free",
    body: "Create your profile free of charge and browse thousands of listings. Add your skills and preferences to get matched with the best opportunities.",
  },
  {
    step: "02",
    title: "Browse jobs & set interviews",
    body: "Search roles that suit your skills. Members enjoy guaranteed interviews with hiring employers, plus recommendations tuned to your profile.",
  },
  {
    step: "03",
    title: "Upskill & prepare",
    body: "Boost your resume and interview performance with our upskilling programs - from interview coaching to certification courses.",
  },
  {
    step: "04",
    title: "Get your dream job",
    body: "Walk in ready to nail the interview and land the role. We support you every step, from application to onboarding.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        eyebrow="For job seekers"
        title="How JobClubb works"
        description="A direct application model — you apply straight to live, verified openings, with no unnecessary intermediaries."
      />

      <Section>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item) => (
            <li key={item.step} className="rounded-2xl border border-border bg-card p-6">
              <span className="font-head text-3xl font-extrabold text-brand/25">
                {item.step}
              </span>
              <h3 className="mt-3 font-head font-bold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section className="bg-card">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionEyebrow>Your resume</SectionEyebrow>
            <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight">
              An ATS-approved resume, built for you
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Every candidate profile — free or paid — generates an AI-built,
              ATS-approved resume. Applicant tracking systems parse it cleanly, so your
              application reaches a human instead of being filtered out.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Generated for every candidate, regardless of tier",
                "Structured so ATS software reads every field",
                "Update prompts sent with your renewal reminder",
                "Tailored to airline, hotel and travel role formats",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 size-4 flex-none text-good" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionEyebrow>How candidates find us</SectionEyebrow>
            <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight">
              Four ways in
            </h2>
            <ul className="mt-6 space-y-3">
              {SOURCING_CHANNELS.map((channel) => (
                <li
                  key={channel}
                  className="rounded-2xl border border-border bg-background px-5 py-4 font-head font-semibold"
                >
                  {channel}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Joining through a franchise partner? Use their code at sign-up so they can
              support your placement.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl bg-linear-to-br from-brand-surface to-brand-surface-strong px-5 py-12 sm:px-8 sm:py-14 text-center text-white shadow-lg">
          <h2 className="font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
            Ready to start?
          </h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-white/80">
            Create a free profile in minutes, then upgrade whenever you&apos;re ready to
            unlock the full board.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              className="bg-white font-head text-brand hover:bg-white/90"
              nativeButton={false}
              render={<Link href="/sign-up" />}
            >
              Create free profile
            </Button>
            <Button
              variant="outline"
              className="border-white/40 bg-transparent font-head text-white hover:bg-white/10 hover:text-white"
              nativeButton={false}
              render={<Link href="/jobs" />}
            >
              Browse jobs
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
