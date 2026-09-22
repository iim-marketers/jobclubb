"use server";

import { redirect } from "next/navigation";

import type { FieldErrors } from "@/lib/sign-up-validation";

const DASHBOARDS = {
  candidate: "/dashboard",
  company: "/company",
  franchise: "/franchise/dashboard",
} as const;

export type SignInRole = keyof typeof DASHBOARDS;

export async function signIn(formData: FormData): Promise<{ errors: FieldErrors }> {
  const role = String(formData.get("role") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const errors: FieldErrors = {};

  if (!(role in DASHBOARDS)) errors.role = "Choose an account type.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  if (Object.keys(errors).length > 0) return { errors };

  // TODO: authenticate once the backend lands — verify the password hash for
  // this email + role, reject companies that aren't verified yet and inactive
  // HR seats, then create the session (honouring "remember me").

  redirect(DASHBOARDS[role as SignInRole]);
}
