"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";

const STORAGE_KEY = "jc_jobs_list";

function lastJobsList() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? "/jobs";
  } catch {
    return "/jobs";
  }
}

const subscribe = () => () => {};

export function RememberJobsList({ href }: { href: string }) {
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, href);
    } catch {}
  }, [href]);
  return null;
}

export function JobsListLink(
  props: Omit<React.ComponentProps<typeof Link>, "href">,
) {
  const href = useSyncExternalStore(subscribe, lastJobsList, () => "/jobs");
  return <Link href={href} {...props} />;
}
