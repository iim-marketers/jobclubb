import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { isMembershipPlan } from "@/lib/membership";
import { createClient } from "@/lib/supabase/server";

export const CHOOSE_PLAN_PATH = "/onboarding/membership";

export const getCurrentCandidate = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;

  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, first_name, last_name, email, city, pincode, vertical, email_verified, membership_plan, code")
    .eq("id", userId)
    .maybeSingle();

  return candidate?.email_verified ? candidate : null;
});

// Token-only check for showing signed-in UI; it doesn't hit the database, so
// anything that needs a verified candidate must use getCurrentCandidate().
export const getCandidateSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const meta = data?.claims.user_metadata;
  if (!data?.claims.sub || meta?.role !== "candidate") return null;
  return {
    firstName: String(meta.first_name ?? ""),
    lastName: String(meta.last_name ?? ""),
    email: String(data.claims.email ?? ""),
  };
});

export async function requireCandidate(returnTo: string) {
  const candidate = await getCurrentCandidate();
  if (!candidate) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return candidate;
}

export async function requireCandidateWithPlan(returnTo: string) {
  const candidate = await requireCandidate(returnTo);
  if (!isMembershipPlan(candidate.membership_plan)) redirect(CHOOSE_PLAN_PATH);
  return { ...candidate, membership_plan: candidate.membership_plan };
}

export async function redirectIfCandidate() {
  if (await getCurrentCandidate()) redirect("/candidate/dashboard");
}
