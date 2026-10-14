"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, CalendarCheck, CalendarClock, CalendarPlus } from "lucide-react";

import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { cn } from "@/lib/utils";

type FitItem = { key: string; node: React.ReactNode; lgOnly?: boolean };
type Fit = { visible: number; filler: "none" | "compact" | "medium" | "full" };

const LG = "(min-width: 1024px)";
const FILLER_MIN = 52;
const FILLER_MEDIUM = 156;
const FILLER_FULL = 204;

// Cards that don't fit wrap into a clipped second column (the empty first item lets even the first one wrap).
export function ScheduleFit({
  items,
  notRendered,
  upcoming,
}: {
  items: FitItem[];
  notRendered: number;
  upcoming: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<Fit | null>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(() => setFit(null));
    observer.observe(box);
    const media = window.matchMedia(LG);
    const reset = () => setFit(null);
    media.addEventListener("change", reset);
    document.fonts?.ready.then(reset);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", reset);
    };
  }, []);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (fit || !box || !window.matchMedia(LG).matches) return;
    const cards = [...box.querySelectorAll<HTMLElement>("[data-fit-item]")];
    const firstWrapped = cards.findIndex((c) => c.offsetLeft > 0);
    const visible = firstWrapped === -1 ? cards.length : firstWrapped;
    const lastBottom = visible
      ? cards[visible - 1].offsetTop + cards[visible - 1].offsetHeight
      : 0;
    const remaining = box.clientHeight - lastBottom;
    setFit({
      visible,
      filler:
        remaining >= FILLER_FULL
          ? "full"
          : remaining >= FILLER_MEDIUM
            ? "medium"
            : remaining >= FILLER_MIN
            ? "compact"
              : "none",
    });
  }, [fit]);

  const more = notRendered + (fit ? items.length - fit.visible : 0);

  return (
    <div className="lg:relative lg:flex-1">
      <div
        ref={boxRef}
        className="lg:absolute lg:inset-0 lg:flex lg:flex-col lg:flex-wrap lg:overflow-clip"
      >
        <div aria-hidden className="lg:w-full" />
        {items.map((item, n) => (
          <div
            key={item.key}
            data-fit-item
            className={cn(
              "pt-3 lg:w-full",
              item.lgOnly && "hidden lg:block",
              fit && n >= fit.visible && "lg:hidden",
            )}
          >
            {item.node}
          </div>
        ))}
        {fit && fit.filler !== "none" && (
          <div className="hidden w-full flex-1 pt-3 lg:flex">
            <Filler more={more} upcoming={upcoming} size={fit.filler} />
          </div>
        )}
      </div>
    </div>
  );
}

function Filler({
  more,
  upcoming,
  size,
}: {
  more: number;
  upcoming: boolean;
  size: "compact" | "medium" | "full";
}) {
  const [Icon, title, body, href, cta] =
    more > 0
      ? [
          CalendarCheck,
          `${more} more interview${more === 1 ? "" : "s"}`,
          "See every round in one place, with search and filters.",
          `${CANDIDATE_HOME}/interviews/all`,
          "View all",
        ]
      : upcoming
        ? [
            CalendarClock,
            "Nothing else scheduled",
            "New interviews show up here as soon as an employer books one.",
            "/jobs",
            "Find more jobs",
          ]
        : [
            CalendarPlus,
            "No upcoming interviews",
            "Keep applying. New interviews show up here as soon as an employer books one.",
            "/jobs",
            "Browse jobs",
          ];

  if (size === "compact")
    return (
      <div className="flex flex-1 items-center gap-3 rounded-2xl border border-dashed border-border px-4">
        <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
        <p className="min-w-0 flex-1 truncate font-head text-sm font-bold">
          {title}
        </p>
        <Link
          href={href}
          className="inline-flex flex-none items-center gap-1 font-head text-xs font-bold text-brand hover:text-brand-dark hover:underline"
        >
          {cta}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    );

  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border p-5 text-center">
      <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-4.5" />
      </span>
      <p className="mt-3 font-head text-sm font-bold">{title}</p>
      {size === "full" && (
        <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
          {body}
        </p>
      )}
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1 font-head text-xs font-bold text-brand hover:text-brand-dark hover:underline"
      >
        {cta}
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
