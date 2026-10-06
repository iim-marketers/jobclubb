"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { safeRedirectPath } from "@/lib/safe-redirect";
import type { FieldErrors } from "@/lib/sign-up-validation";
import { createClient } from "@/lib/supabase/server";
import {
  PENDING_EMAIL_COOKIE,
  REMEMBERED_EMAIL_MAX_AGE,
  rememberedEmailCookie,
} from "@/lib/supabase/session";
import { signInCandidate, signInCompany } from "@/server/auth/sign-in";

const DASHBOARDS = {
  candidate: "/candidate/dashboard",
  company: "/company/dashboard",
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

  if (role === "franchise") {
    // TODO: move franchise accounts onto Supabase.
    redirect(DASHBOARDS.franchise);
  }

  const signInAs = role === "company" ? signInCompany : signInCandidate;
  const result = await signInAs(await createClient(), {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!result.ok)
    return { errors: result.errors, unconfirmedEmail: result.unconfirmedEmail };

  const cookieStore = await cookies();
  const rememberCookie = rememberedEmailCookie(role);
  if (remember)
    cookieStore.set(rememberCookie, result.user.email ?? "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: REMEMBERED_EMAIL_MAX_AGE,
    });
  else cookieStore.delete(rememberCookie);
  cookieStore.delete(PENDING_EMAIL_COOKIE);
  const next = safeRedirectPath(formData.get("next"), DASHBOARDS.candidate);
  if (role === "company")
    redirect(next.startsWith("/company/") ? next : DASHBOARDS.company);
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  const { data: company } = userId
    ? await supabase.from("companies").select("id").eq("id", userId).maybeSingle()
    : { data: null };
  await supabase.auth.signOut();
  redirect(company ? "/sign-in?as=company" : "/sign-in");
}
