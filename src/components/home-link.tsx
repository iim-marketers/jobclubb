"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HomeLink(
  props: Omit<React.ComponentProps<typeof Link>, "href">,
) {
  const pathname = usePathname();
  return (
    <Link
      {...props}
      href="/"
      onClick={(e) => {
        props.onClick?.(e);
        if (pathname !== "/" || e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
    />
  );
}
