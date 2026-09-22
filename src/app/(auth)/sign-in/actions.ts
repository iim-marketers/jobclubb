"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { safeRedirectPath } from "@/lib/safe-redirect";
import type { FieldErrors } from "@/lib/sign-up-validation";
import { createClient } from "@/lib/supabase/server";
import { PENDING_EMAIL_COOKIE, SESSION_ONLY_COOKIE } from "@/lib/supabase/session";

const DASHBOARDS = {
  candidate: "/dashboard",
  company: "/company",
  franchise: "/franchise/dashboard",
} as const;

export type SignInRole = keyof typeof DASHBOARDS;

export type SignInResult = {
  errors: FieldErrors;
  unconfirmedEmail?: string;
};

export async function signIn(formData: FormData): Promise<SignInResult> {
  const role = String(formData.get("role") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "yes";
  const errors: FieldErrors = {};

  if (!(role in DASHBOARDS)) errors.role = "Choose an account type.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  if (Object.keys(errors).length > 0) return { errors };

  if (role !== "candidate") {
    // TODO: move company and franchise accounts onto Supabase — reject
    // companies that aren't verified yet and inactive HR seats.
    redirect(DASHBOARDS[role as SignInRole]);
  }

  const cookieStore = await cookies();
  if (remember) cookieStore.delete(SESSION_ONLY_COOKIE);
  else cookieStore.set(SESSION_ONLY_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/" });

  const supabase = await createClient({ sessionOnly: !remember });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { errors: {}, unconfirmedEmail: email };
    }
    if (error.code === "invalid_credentials") {
      return { errors: { password: "Incorrect email or password." } };
    }
    console.error("Sign-in failed", error);
    return { errors: { password: "We couldn't sign you in. Please try again." } };
  }

  const { data: candidate } = await supabase
    .from("candidates")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!candidate) {
    await supabase.auth.signOut();
    return { errors: { role: "This account isn't a candidate account. Choose the right account type." } };
  }

  cookieStore.delete(PENDING_EMAIL_COOKIE);
  redirect(safeRedirectPath(formData.get("next"), DASHBOARDS.candidate));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(SESSION_ONLY_COOKIE);
  redirect("/sign-in");
}
