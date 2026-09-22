"use client";

import { useLayoutEffect, type RefObject } from "react";

// Keeps a fixed-height box from ever needing to scroll: descendants marked
// `data-fit="N"` are hidden, highest N first, until the content fits. Only
// runs from `minWidth` up — below that the box isn't height-constrained.
export function useFitToHeight(
  ref: RefObject<HTMLElement | null>,
  minWidth = 1024,
) {
  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return;
    const media = window.matchMedia(`(min-width: ${minWidth}px)`);

    const fit = () => {
      const items = Array.from(box.querySelectorAll<HTMLElement>("[data-fit]")).sort(
        (a, b) => Number(b.dataset.fit) - Number(a.dataset.fit),
      );
      items.forEach((el) => (el.hidden = false));
      if (!media.matches) return;
      const fits = () => box.scrollHeight <= box.clientHeight;
      for (const el of items) {
        if (fits()) break;
        el.hidden = true;
      }
      // Hiding a big block can free more room than needed, so give smaller
      // details another chance, most important first.
      for (const el of [...items].reverse()) {
        if (!el.hidden) continue;
        el.hidden = false;
        if (!fits()) el.hidden = true;
      }
    };

    fit();
    // Re-fit when the viewport changes or the content grows/shrinks (e.g. the
    // live preview wrapping differently as someone types).
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };
    const observer = new ResizeObserver(schedule);
    const observeAll = () => {
      observer.observe(box);
      Array.from(box.children).forEach((child) => observer.observe(child));
    };
    observeAll();
    // Content swapped out entirely (e.g. a different preview) — re-observe.
    const mutations = new MutationObserver(() => {
      observer.disconnect();
      observeAll();
      schedule();
    });
    mutations.observe(box, { childList: true, subtree: true });
    media.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
      media.removeEventListener("change", schedule);
    };
  }, [ref, minWidth]);
}
