"use server";

import { redirect } from "next/navigation";

import {
  ADMIN_HOME,
  ADMIN_LOGIN_PATH,
  adminConfigured,
  endAdminSession,
  startAdminSession,
  verifyAdminCredentials,
} from "@/server/admin/session";

export async function adminSignIn(formData: FormData): Promise<{ error: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!adminConfigured()) return { error: "Admin login isn't configured on this server." };
  if (!email || !password) return { error: "Enter your email and password." };
  if (!verifyAdminCredentials(email, password)) {
    return { error: "That email and password don't match an admin account." };
  }

  await startAdminSession();
  redirect(ADMIN_HOME);
}

export async function adminSignOut() {
  await endAdminSession();
  redirect(ADMIN_LOGIN_PATH);
}
