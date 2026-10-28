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
  type PaidPlan,
} from "@/lib/membership";
import { addDays, deadlineEnd, isFresher } from "@/lib/placements";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const OFFER_ACCESS_DAYS = 30;

export const getCurrentCandidate = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;

  const { data: candidate } = await supabase
    .from("candidates")
    .select(
      "id, first_name, last_name, email, phone, city, pincode, industry, preferred_roles, email_verified, code, membership_plan, membership_expires_at, photo_path, emporium_batch_id",
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

export const getLapsedAccessUntil = cache(
  async (candidateId: string, expiresAt: string) => {
    const admin = createAdminClient();
    const [interview, offers] = await Promise.all([
      admin
        .from("job_interviews")
        .select("starts_at")
        .eq("candidate_id", candidateId)
        .is("cancelled_at", null)
        .gt("starts_at", expiresAt)
        .order("starts_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("placements")
        .select("joining_date")
        .eq("candidate_id", candidateId)
        .in("status", ["released", "accepted", "joined", "not_joined"]),
    ]);
    if (interview.error) console.error("Loading lapsed member access failed", interview.error);
    if (offers.error) console.error("Loading lapsed member offers failed", offers.error);

    const ends: Date[] = (offers.data ?? []).flatMap((o) =>
      o.joining_date ? [deadlineEnd(addDays(o.joining_date, OFFER_ACCESS_DAYS))] : [],
    );
    if (interview.data) {
      const until = new Date(interview.data.starts_at);
      until.setDate(until.getDate() + INTERVIEW_GRACE_DAYS);
      ends.push(until);
    }
    const until = ends.reduce<Date | null>((latest, d) => (!latest || d > latest ? d : latest), null);
    return until && until.getTime() > Date.now() ? until : null;
  },
);

export async function getLapsedAccess() {
  const candidate = await getCurrentCandidate();
  const expiresAt = candidate?.membership_expires_at as string | null | undefined;
  if (!candidate || !expiresAt || isMembershipActive(expiresAt)) return null;
  return getLapsedAccessUntil(candidate.id, expiresAt);
}

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
      plan: PaidPlan;
      code: string | null;
      fresher: boolean;
      expired: boolean;
    }
  | {
      kind: "member";
      plan: MembershipPlan;
      code: string | null;
      fresher: boolean;
      validUntil: string;
      daysLeft: number;
    };

export const getMembershipView = cache(async (): Promise<MembershipView> => {
  const candidate = await getCurrentCandidate();
  if (!candidate) return { kind: "guest" };

  const code = candidate.code as string | null;
  const fresher = isFresher(candidate);
  if (!isMembershipActive(candidate.membership_expires_at))
    return {
      kind: "unpaid",
      plan: planFor(code),
      code,
      fresher,
      expired: !!candidate.membership_expires_at,
    };

  const expiresAt = new Date(candidate.membership_expires_at as string);
  return {
    kind: "member",
    plan: isMembershipPlan(candidate.membership_plan)
      ? candidate.membership_plan
      : planFor(code),
    code,
    fresher,
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
