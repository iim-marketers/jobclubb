import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import {
  isMembershipActive,
  isMembershipPlan,
  planFor,
  type MembershipPlan,
} from "@/lib/membership";
import { createClient } from "@/lib/supabase/server";

export const CHECKOUT_PATH = "/onboarding/membership";

export const getCurrentCandidate = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;

  const { data: candidate } = await supabase
    .from("candidates")
    .select(
      "id, first_name, last_name, email, phone, city, pincode, vertical, email_verified, code, membership_plan, membership_expires_at",
    )
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

export async function requireMember(returnTo: string) {
  const candidate = await requireCandidate(returnTo);
  if (!isMembershipActive(candidate.membership_expires_at))
    redirect(CHECKOUT_PATH);
  return {
    ...candidate,
    membership_plan: isMembershipPlan(candidate.membership_plan)
      ? candidate.membership_plan
      : planFor(candidate.code),
    membership_expires_at: candidate.membership_expires_at as string,
  };
}

export type MembershipView =
  | { kind: "guest" }
  | { kind: "unpaid"; plan: MembershipPlan; code: string | null }
  | {
      kind: "member";
      plan: MembershipPlan;
      code: string | null;
      validUntil: string;
      daysLeft: number;
    };

export const getMembershipView = cache(async (): Promise<MembershipView> => {
  const candidate = await getCurrentCandidate();
  if (!candidate) return { kind: "guest" };

  const code = candidate.code as string | null;
  if (!isMembershipActive(candidate.membership_expires_at))
    return { kind: "unpaid", plan: planFor(code), code };

  const expiresAt = new Date(candidate.membership_expires_at as string);
  return {
    kind: "member",
    plan: isMembershipPlan(candidate.membership_plan)
      ? candidate.membership_plan
      : planFor(code),
    code,
    validUntil: new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(expiresAt),
    daysLeft: Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000),
  };
});

export async function getJobAccess() {
  const view = await getMembershipView();
  return { signedIn: view.kind !== "guest", member: view.kind === "member" };
}

export async function redirectIfCandidate() {
  if (await getCurrentCandidate()) redirect("/candidate/dashboard");
}
