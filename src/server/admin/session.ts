import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_SESSION_COOKIE = "jc-admin";
const SESSION_MAX_AGE = 12 * 60 * 60;

export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_HOME = "/admin/companies";

function adminConfig() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!email || !password || !secret) return null;
  return { email, password, secret };
}

const digest = (value: string) => createHash("sha256").update(value).digest();

// Hash first so timingSafeEqual gets equal-length buffers and leaks nothing about length.
const safeEqual = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

// Keyed with the Supabase secret too, so a leaked cookie can't be used to brute-force
// ADMIN_PASSWORD offline. Changing the password signs every admin out.
function sign(expiresAt: number, config: NonNullable<ReturnType<typeof adminConfig>>) {
  return createHmac("sha256", `${config.secret}:${config.email}:${config.password}`)
    .update(String(expiresAt))
    .digest("base64url");
}

export function adminConfigured() {
  return adminConfig() !== null;
}

export function verifyAdminCredentials(email: string, password: string) {
  const config = adminConfig();
  if (!config) return false;
  const emailOk = safeEqual(email.trim().toLowerCase(), config.email);
  const passwordOk = safeEqual(password, config.password);
  return emailOk && passwordOk;
}

export async function startAdminSession() {
  const config = adminConfig();
  if (!config) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are not set.");

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  (await cookies()).set(ADMIN_SESSION_COOKIE, `${expiresAt}.${sign(expiresAt, config)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}

export async function isAdmin() {
  const config = adminConfig();
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!config || !token) return false;

  const [expiry, signature] = token.split(".");
  const expiresAt = Number(expiry);
  if (!signature || !Number.isInteger(expiresAt)) return false;
  if (expiresAt < Date.now() / 1000) return false;
  return safeEqual(signature, sign(expiresAt, config));
}

// Call from every admin page and server action: server actions are public endpoints,
// so the layout check alone doesn't protect them.
export async function requireAdmin() {
  if (!(await isAdmin())) redirect(ADMIN_LOGIN_PATH);
}
