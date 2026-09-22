import type { CookieOptions } from "@supabase/ssr";

export const SESSION_ONLY_COOKIE = "jc-session-only";

export function sessionCookieOptions(
  sessionOnly: boolean,
  options: CookieOptions,
): CookieOptions {
  if (!sessionOnly) return options;
  return { ...options, maxAge: undefined, expires: undefined };
}

export const PENDING_EMAIL_COOKIE = "jc-pending-email";
