"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { FieldErrors } from "@/lib/sign-up-validation";
import { PENDING_EMAIL_COOKIE } from "@/lib/supabase/session";
import { registerFranchise as registerFranchiseAccount } from "@/server/franchises/register";

export async function registerFranchise(formData: FormData): Promise<{ errors: FieldErrors }> {
  const result = await registerFranchiseAccount(formData);
  if (!result.ok) return { errors: result.errors };

  (await cookies()).set(PENDING_EMAIL_COOKIE, result.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  redirect("/sign-up/submitted?route=franchise");
}
