"use client";

import { useEffect, useRef, useState } from "react";

import { TERMS_SECTIONS, termsLabel, termsSlug } from "@/lib/terms-content";

const ITEMS = TERMS_SECTIONS.map((s, i) => ({
  id: termsSlug(s.heading),
  label: termsLabel(s.heading),
  index: i + 1,
}));

export function TermsNav() {
  const [active, setActive] = useState(ITEMS[0].id);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const sections = ITEMS.map((i) => document.getElementById(i.id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (!sections.length) return;

    function update() {
      // Bottom of page: always mark the last section, even if it's short.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActive(ITEMS[ITEMS.length - 1].id);
        return;
      }
      // Otherwise: the last section whose top has passed the reading line.
      const line = 140;
      let current = sections[0].id;
      for (const el of sections) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
        else break;
      }
      setActive(current);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Keep the active item visible inside the (scrollable) nav column.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-id="${active}"]`
    );
    const list = listRef.current;
    if (!el || !list) return;
    const elTop = el.offsetTop;
    const elBottom = elTop + el.offsetHeight;
    if (elTop < list.scrollTop || elBottom > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: elTop - list.clientHeight / 2, behavior: "smooth" });
    }
  }, [active]);

  return (
    <nav aria-label="Terms sections" className="lg:sticky lg:top-24">
      <p className="font-head text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
        On this page
      </p>

      <ol
        ref={listRef}
        className="mt-3 max-h-[60vh] space-y-0.5 overflow-y-auto pr-1 lg:max-h-[calc(100vh-11rem)]"
      >
        {ITEMS.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id} data-id={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`flex gap-2.5 rounded-lg border-l-2 py-2 pr-2 pl-3 text-sm transition-colors ${
                  isActive
                    ? "border-brand bg-brand/5 font-semibold text-brand"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span
                  className={`font-head text-xs tabular-nums ${
                    isActive ? "text-brand" : "text-muted-foreground/60"
                  }`}
                >
                  {String(item.index).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
