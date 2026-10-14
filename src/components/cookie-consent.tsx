"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie, X } from "lucide-react";

import { Button } from "@/components/ui/button";

// Bump the version when the cookie policy changes so everyone is asked again.
const CONSENT_COOKIE = "jc_cookie_consent";
const CONSENT_VERSION = "1";
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;
const DISMISSED_COOKIE = "jc_cookie_dismissed";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function isHidden() {
  const cookies = document.cookie.split("; ");
  return (
    cookies.includes(`${CONSENT_COOKIE}=${CONSENT_VERSION}`) ||
    cookies.includes(`${DISMISSED_COOKIE}=1`)
  );
}

function setCookie(value: string) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${value}; Path=/; SameSite=Lax${secure}`;
  for (const listener of listeners) listener();
}

function acceptCookies() {
  setCookie(`${CONSENT_COOKIE}=${CONSENT_VERSION}; Max-Age=${CONSENT_MAX_AGE}`);
}

function dismissBanner() {
  setCookie(`${DISMISSED_COOKIE}=1`);
}

export function CookieConsent() {
  // Server snapshot reports consent so the banner never flashes before hydration.
  const hidden = useSyncExternalStore(subscribe, isHidden, () => true);
  const [leaving, setLeaving] = useState(false);
  const pathname = usePathname();

  if (hidden || pathname.startsWith("/admin")) return null;

  function close(action: () => void) {
    setLeaving(true);
    setTimeout(action, 200);
  }

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-body"
      data-leaving={leaving || undefined}
      className="fixed inset-x-3 bottom-3 z-50 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-[0_8px_24px_-10px_rgb(11_23_35/0.25)] duration-300 animate-in fade-in slide-in-from-bottom-4 data-leaving:animate-out data-leaving:fade-out data-leaving:slide-out-to-bottom-4 data-leaving:fill-mode-forwards data-leaving:duration-200 motion-reduce:animate-none sm:right-auto sm:bottom-6 sm:left-6 sm:w-72"
    >
      <div className="h-0.5 bg-linear-to-r from-brand to-brand-accent" />
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Close"
        className="absolute top-2.5 right-2.5 text-muted-foreground"
        onClick={() => close(dismissBanner)}
      >
        <X />
      </Button>
      <div className="p-4 pt-3.5">
        <div className="flex items-center gap-2 pr-7">
          <Cookie className="size-4 shrink-0 text-brand" />
          <h2
            id="cookie-consent-title"
            className="font-head text-sm font-semibold"
          >
            We use cookies
          </h2>
        </div>
        <p
          id="cookie-consent-body"
          className="mt-1.5 text-xs leading-relaxed text-muted-foreground"
        >
          Essential cookies only, to keep you signed in.{" "}
          <Link
            href="/privacy"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Learn more
          </Link>
        </p>
        <Button
          variant="link"
          className="mt-1 ml-auto flex h-auto p-0 text-sm font-semibold"
          onClick={() => close(acceptCookies)}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
