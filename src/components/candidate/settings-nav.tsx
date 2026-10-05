"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Camera, KeyRound, Mail, SlidersHorizontal, User } from "lucide-react";

import { cn } from "@/lib/utils";

export type SettingsSection = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const SECTIONS: SettingsSection[] = [
  { id: "photo", label: "Profile photo", icon: Camera },
  { id: "profile", label: "Personal details", icon: User },
  { id: "preferences", label: "Job preferences", icon: SlidersHorizontal },
  { id: "security", label: "Password", icon: KeyRound },
  { id: "account", label: "Account", icon: Mail },
];

// Matches the Panel's scroll-mt-24 plus a little slack.
const ACTIVE_OFFSET = 120;

type Indicator = { x: number; y: number; w: number; h: number };

export function SettingsNav({
  sections = SECTIONS,
}: {
  sections?: SettingsSection[];
}) {
  const [active, setActive] = useState(sections[0].id);
  const [indicator, setIndicator] = useState<Indicator | null>(null);
  const [animate, setAnimate] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const lockRef = useRef(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (lockRef.current) return;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      let current = sections[0].id;
      for (const { id } of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = id;
      }
      setActive(atBottom ? sections[sections.length - 1].id : current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const unlock = () => {
      lockRef.current = false;
    };
    const unlockEvents = ["wheel", "touchstart", "keydown", "pointerdown"];
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    for (const type of unlockEvents) {
      window.addEventListener(type, unlock, { passive: true });
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      for (const type of unlockEvents) {
        window.removeEventListener(type, unlock);
      }
    };
  }, [sections]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const link = linkRefs.current[active];
      if (!link) return;
      setIndicator({
        x: link.offsetLeft,
        y: link.offsetTop,
        w: link.offsetWidth,
        h: link.offsetHeight,
      });
      if (nav.scrollWidth > nav.clientWidth) {
        nav.scrollTo({
          left: link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2,
          behavior: "smooth",
        });
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [active]);

  // Skip the transition on the first placement so the pill doesn't fly in from 0,0.
  useEffect(() => {
    if (!indicator || animate) return;
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [indicator, animate]);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    lockRef.current = true;
    setActive(id);
    el.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <nav
      ref={navRef}
      aria-label="Settings sections"
      className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-3xl lg:border lg:border-border lg:bg-card lg:p-2"
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-0 left-0 rounded-full bg-brand lg:rounded-2xl lg:bg-brand/10",
          animate &&
            "transition-[transform,width,height] duration-300 ease-out motion-reduce:transition-none",
          !indicator && "opacity-0",
        )}
        style={
          indicator
            ? {
                width: indicator.w,
                height: indicator.h,
                transform: `translate(${indicator.x}px, ${indicator.y}px)`,
              }
            : undefined
        }
      />
      {sections.map(({ id, label, icon: Icon }) => {
        const current = active === id;
        return (
          <a
            key={id}
            ref={(el) => {
              linkRefs.current[id] = el;
            }}
            href={`#${id}`}
            onClick={(e) => onClick(e, id)}
            aria-current={current ? "location" : undefined}
            className={cn(
              "relative flex flex-none items-center gap-1.5 rounded-full border px-3.5 py-2 font-head text-sm font-semibold whitespace-nowrap transition-colors duration-300 lg:rounded-2xl lg:border-transparent lg:px-3 lg:py-2.5",
              current
                ? "border-transparent text-brand-foreground lg:text-brand"
                : "border-border bg-card text-muted-foreground hover:text-foreground lg:bg-transparent lg:hover:bg-muted",
            )}
          >
            <Icon className="size-4 flex-none" />
            {label}
          </a>
        );
      })}
    </nav>
  );
}
