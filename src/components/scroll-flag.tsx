"use client";

import { useEffect } from "react";

export function ScrollFlag() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () =>
      root.toggleAttribute("data-scrolled", window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      root.removeAttribute("data-scrolled");
    };
  }, []);
  return null;
}
