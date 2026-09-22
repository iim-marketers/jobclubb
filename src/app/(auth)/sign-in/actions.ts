"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { safeRedirectPath } from "@/lib/safe-redirect";
import type { FieldErrors } from "@/lib/sign-up-validation";
import { createClient } from "@/lib/supabase/server";
import {
  PENDING_EMAIL_COOKIE,
  SESSION_ONLY_COOKIE,
} from "@/lib/supabase/session";
import { signInCandidate } from "@/server/auth/sign-in";

const DASHBOARDS = {
  candidate: "/candidate/dashboard",
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
  const remember = formData.get("remember") === "yes";

  if (!(role in DASHBOARDS))
    return { errors: { role: "Choose an account type." } };

  if (role !== "candidate") {
    // TODO: move company and franchise accounts onto Supabase — reject
    // companies that aren't verified yet and inactive HR seats.
    redirect(DASHBOARDS[role as SignInRole]);
  }

  const cookieStore = await cookies();
  if (remember) cookieStore.delete(SESSION_ONLY_COOKIE);
  else
    cookieStore.set(SESSION_ONLY_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

  const result = await signInCandidate(
    await createClient({ sessionOnly: !remember }),
    {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    },
  );
  if (!result.ok)
    return { errors: result.errors, unconfirmedEmail: result.unconfirmedEmail };

  cookieStore.delete(PENDING_EMAIL_COOKIE);
  redirect(safeRedirectPath(formData.get("next"), DASHBOARDS.candidate));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(SESSION_ONLY_COOKIE);
  redirect("/sign-in");
}
