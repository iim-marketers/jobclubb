import { isFranchiseCode } from "@/lib/sign-up-validation";

export const MEMBERSHIP_PLANS = ["member", "franchise"] as const;
export type MembershipPlan = (typeof MEMBERSHIP_PLANS)[number];

export const PLAN_DETAILS: Record<
  MembershipPlan,
  { name: string; price: string; amount: number }
> = {
  member: { name: "JobClubb Membership", price: "₹1,499", amount: 1499 },
  franchise: { name: "Franchise Membership", price: "₹1,199", amount: 1199 },
};

export const MEMBERSHIP_DAYS = 365;

export const MEMBER_FEATURES = [
  "Full job details and employer info",
  "Unlimited one-click apply",
  "3 guaranteed employer interviews",
  "AI-built, ATS-approved resume",
  "Upskilling & certification access",
  "Priority support till you're hired",
];

export function isMembershipPlan(value: unknown): value is MembershipPlan {
  return MEMBERSHIP_PLANS.includes(value as MembershipPlan);
}

// Candidates who signed up with a franchise partner's code pay the franchise
// price; the database refuses that plan for anyone else.
export function planFor(signUpCode: string | null): MembershipPlan {
  return signUpCode && isFranchiseCode(signUpCode) ? "franchise" : "member";
}

export function isMembershipActive(expiresAt: string | null | undefined) {
  return !!expiresAt && new Date(expiresAt).getTime() > Date.now();
}
