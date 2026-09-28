"use client";

import { useEffect, useState } from "react";
import { KeyRound, Mail, SlidersHorizontal, User } from "lucide-react";

import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "profile", label: "Personal details", icon: User },
  { id: "preferences", label: "Job preferences", icon: SlidersHorizontal },
  { id: "security", label: "Password", icon: KeyRound },
  { id: "account", label: "Account", icon: Mail },
];

// Matches the Panel's scroll-mt-24 plus a little slack.
const ACTIVE_OFFSET = 120;

export function SettingsNav() {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const onScroll = () => {
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      let current = SECTIONS[0].id;
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = id;
      }
      setActive(atBottom ? SECTIONS[SECTIONS.length - 1].id : current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Settings sections"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-3xl lg:border lg:border-border lg:bg-card lg:p-2"
    >
      {SECTIONS.map(({ id, label, icon: Icon }) => {
        const current = active === id;
        return (
          <a
            key={id}
            href={`#${id}`}
            onClick={() => setActive(id)}
            aria-current={current ? "location" : undefined}
            className={cn(
              "flex flex-none items-center gap-2.5 rounded-full border px-3.5 py-2 font-head text-sm font-semibold whitespace-nowrap transition-colors lg:rounded-2xl lg:border-transparent lg:px-3 lg:py-2.5",
              current
                ? "border-brand bg-brand text-brand-foreground lg:border-transparent lg:bg-brand/10 lg:text-brand"
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
