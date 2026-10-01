import type { CookieOptions } from "@supabase/ssr";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export function authCookieOptions(options: CookieOptions): CookieOptions {
  // Supabase deletes cookies with maxAge 0; keep that or they linger as empty cookies.
  if (options.maxAge === 0) return options;
  return { ...options, maxAge: SESSION_MAX_AGE, expires: undefined };
}

export const PENDING_EMAIL_COOKIE = "jc-pending-email";

export const REMEMBERED_EMAIL_COOKIE = "jc-remembered-email";
export const REMEMBERED_EMAIL_MAX_AGE = 365 * 24 * 60 * 60;
