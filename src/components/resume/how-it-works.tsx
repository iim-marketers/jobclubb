import { Download, Target, Upload } from "lucide-react";

import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Upload,
    title: "Add what you have",
    body: "Upload your current resume as a PDF, or just describe your jobs and education.",
  },
  {
    icon: Target,
    title: "We match the keywords",
    body: "We find what recruiters' software screens for in your role — or in a job post you paste.",
  },
  {
    icon: Download,
    title: "Download and apply",
    body: "Get an ATS score, see which keywords are missing, and download a clean PDF.",
  },
];

export function HowItWorks() {
  return (
    <section className="min-w-0 space-y-6 rounded-3xl bg-linear-to-br from-brand-surface to-brand-surface-strong p-6 text-white sm:p-7">
      <div>
        <p className="font-head text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase">
          How it works
        </p>
        <h2 className="mt-1 font-head text-lg font-bold tracking-tight">
          An ATS-ready resume in under a minute
        </h2>
      </div>

      <ol className="space-y-4">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3">
            <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-white/15">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="font-head text-sm font-bold">{title}</p>
              <p className="mt-0.5 text-xs leading-5 text-white/75">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div
        aria-hidden
        className="rounded-2xl bg-white p-5 shadow-xl shadow-black/20"
      >
        <div className="h-3 w-2/5 rounded-full bg-neutral-800" />
        <div className="mt-2 h-2 w-3/5 rounded-full bg-neutral-300" />
        <div className="mt-4 border-t border-neutral-200 pt-4">
          <div className="h-1.5 w-1/4 rounded-full bg-neutral-400" />
          <div className="mt-2.5 space-y-1.5">
            <div className="h-1.5 rounded-full bg-neutral-200" />
            <div className="h-1.5 w-11/12 rounded-full bg-neutral-200" />
            <div className="h-1.5 w-4/5 rounded-full bg-neutral-200" />
          </div>
          <div className="mt-4 h-1.5 w-1/4 rounded-full bg-neutral-400" />
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {["w-12", "w-16", "w-10", "w-14", "w-12"].map((w, i) => (
              <span
                key={i}
                className={cn("h-3.5 rounded-full bg-brand/15", w)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
