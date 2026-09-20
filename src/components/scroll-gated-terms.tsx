"use client";

import { useRef, useState } from "react";
import { Check, Lock } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TERMS_SECTIONS, TERMS_VERSION } from "@/lib/terms-content";

/**
 * SOP §3.5 — the T&C checkbox must stay disabled until the candidate has
 * scrolled through the entire document. Enforced via scroll tracking, not a
 * static checkbox.
 *
 * On the real build, accepting records (user, tc_version, timestamp, ip)
 * so consent is provable against a specific version of the text.
 */
export function ScrollGatedTerms({ onAccept }: { onAccept?: (v: boolean) => void }) {
  const [hasRead, setHasRead] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const pct = max <= 0 ? 1 : el.scrollTop / max;
    setProgress(Math.min(1, pct));
    // 2px tolerance for sub-pixel scroll heights
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) setHasRead(true);
  }

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="font-head text-sm font-bold tracking-tight">
          Terms &amp; Conditions
        </h3>
        <span className="text-xs text-muted-foreground">
          Version {TERMS_VERSION}
        </span>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-64 space-y-4 overflow-y-auto px-5 py-4 text-sm leading-6 text-muted-foreground"
      >
        {TERMS_SECTIONS.map((section) => (
          <section key={section.heading}>
            <h4 className="font-head font-bold text-foreground">{section.heading}</h4>
            <p className="mt-1.5">{section.body}</p>
          </section>
        ))}
      </div>

      {/* Read progress */}
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-brand transition-[width] duration-150"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <div className="px-5 py-4">
        <div
          className={`flex items-start gap-3 ${
            hasRead ? "" : "cursor-not-allowed opacity-60"
          }`}
        >
          <Checkbox
            id="accept-terms"
            className="mt-0.5"
            disabled={!hasRead}
            checked={accepted}
            onCheckedChange={(checked) => {
              setAccepted(checked);
              onAccept?.(checked);
            }}
          />
          <Label
            htmlFor="accept-terms"
            className={`text-sm font-normal leading-6 text-muted-foreground ${
              hasRead ? "cursor-pointer" : "cursor-not-allowed"
            }`}
          >
            I have read and agree to the Terms &amp; Conditions and the Privacy Policy,
            and I consent to my personal data being processed as described, in line with
            the Digital Personal Data Protection Act.
          </Label>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-xs">
          {hasRead ? (
            <>
              <Check className="size-3.5 text-good" />
              <span className="text-good">
                You&apos;ve read the full document — you can now accept.
              </span>
            </>
          ) : (
            <>
              <Lock className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                Scroll to the end of the document to enable this checkbox.
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
