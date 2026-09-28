"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import type { InterviewMode } from "@/lib/candidate-activity";
import { cn } from "@/lib/utils";

const COMMON = [
  "Re-read the job description and match 3 of your strengths to it",
  "Practise your 60-second introduction out loud",
  "Prepare two questions to ask the interviewer",
  "Keep your ATS resume and ID proof handy",
];

const BY_MODE: Record<InterviewMode, string[]> = {
  "Video call": [
    "Test your camera, mic and internet 30 minutes before",
    "Pick a quiet, well-lit spot with a plain background",
  ],
  "In person": [
    "Plan your route and arrive 15 minutes early",
    "Carry two printed copies of your resume",
  ],
  Phone: [
    "Charge your phone and find a quiet room",
    "Keep a notepad ready for names and follow-ups",
  ],
};

export function PrepChecklist({
  interviewId,
  mode,
}: {
  interviewId: string;
  mode: InterviewMode;
}) {
  const items = [...BY_MODE[mode], ...COMMON];
  const storageKey = `jc-prep-${interviewId}`;
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
      if (Array.isArray(saved)) setDone(saved);
    } catch {}
  }, [storageKey]);

  function toggle(item: string) {
    const next = done.includes(item)
      ? done.filter((d) => d !== item)
      : [...done, item];
    setDone(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  }

  const progress = Math.round(
    (items.filter((i) => done.includes(i)).length / items.length) * 100,
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-good transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-head text-xs font-bold text-muted-foreground">
          {progress}% ready
        </span>
      </div>
      <ul className="space-y-1">
        {items.map((item) => {
          const checked = done.includes(item);
          return (
            <li key={item}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggle(item)}
                className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left text-sm transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 flex-none items-center justify-center rounded-md border transition-colors",
                    checked
                      ? "border-good bg-good text-white"
                      : "border-input bg-card",
                  )}
                >
                  {checked && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span
                  className={cn(
                    checked && "text-muted-foreground line-through",
                  )}
                >
                  {item}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
