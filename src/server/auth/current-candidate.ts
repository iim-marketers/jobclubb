import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import {
  CHECKOUT_PATH,
  INTERVIEW_GRACE_DAYS,
  isMembershipActive,
  isMembershipPlan,
  planFor,
  type MembershipPlan,
} from "@/lib/membership";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const getCurrentCandidate = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;

  const { data: candidate } = await supabase
    .from("candidates")
    .select(
      "id, first_name, last_name, email, phone, city, pincode, industry, preferred_roles, email_verified, code, membership_plan, membership_expires_at, photo_path",
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

// A lapsed member with interviews set after their expiry keeps read-only access
// until INTERVIEW_GRACE_DAYS after the last one, so the lapse doesn't cut them
// off mid-hiring. Returns null once that window has passed.
export const getLapsedAccessUntil = cache(
  async (candidateId: string, expiresAt: string) => {
    const { data, error } = await createAdminClient()
      .from("job_interviews")
      .select("starts_at")
      .eq("candidate_id", candidateId)
      .is("cancelled_at", null)
      .gt("starts_at", expiresAt)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) console.error("Loading lapsed member access failed", error);
    if (!data) return null;

    const until = new Date(data.starts_at);
    until.setDate(until.getDate() + INTERVIEW_GRACE_DAYS);
    return until.getTime() > Date.now() ? until : null;
  },
);

export async function getLapsedAccess() {
  const candidate = await getCurrentCandidate();
  const expiresAt = candidate?.membership_expires_at as string | null | undefined;
  if (!candidate || !expiresAt || isMembershipActive(expiresAt)) return null;
  return getLapsedAccessUntil(candidate.id, expiresAt);
}

// allowLapsed is for the read-only pages a lapsed member keeps during their
// interview window (see getLapsedAccessUntil).
export async function requireMember(
  returnTo: string,
  { allowLapsed = false }: { allowLapsed?: boolean } = {},
) {
  const candidate = await requireCandidate(returnTo);
  const expiresAt = candidate.membership_expires_at as string | null;
  const lapsed = !isMembershipActive(expiresAt);
  const lapsedAccessUntil =
    lapsed && allowLapsed && expiresAt
      ? await getLapsedAccessUntil(candidate.id, expiresAt)
      : null;
  if (lapsed && !lapsedAccessUntil) redirect(CHECKOUT_PATH);
  return {
    ...candidate,
    membership_plan: isMembershipPlan(candidate.membership_plan)
      ? candidate.membership_plan
      : planFor(candidate.code),
    membership_expires_at: expiresAt as string,
    lapsed,
    lapsedAccessUntil,
  };
}

export type MembershipView =
  | { kind: "guest" }
  | {
      kind: "unpaid";
      plan: MembershipPlan;
      code: string | null;
      expired: boolean;
    }
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
    return {
      kind: "unpaid",
      plan: planFor(code),
      code,
      expired: !!candidate.membership_expires_at,
    };

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
  return {
    signedIn: view.kind !== "guest",
    member: view.kind === "member",
    expired: view.kind === "unpaid" && view.expired,
  };
}

export async function redirectIfCandidate() {
  if (await getCurrentCandidate()) redirect("/candidate/dashboard");
}
