import { isFranchiseCode } from "@/lib/sign-up-validation";

export const MEMBERSHIP_PLANS = ["free", "member", "franchise"] as const;
export type MembershipPlan = (typeof MEMBERSHIP_PLANS)[number];

export const MEMBERSHIP_PRICE = "₹1,499";
export const FRANCHISE_PRICE = "₹1,199";

export const FREE_FEATURES = [
  "Browse every live job",
  "See location, role, experience and salary",
  "Your JobClubb candidate profile",
];

export const MEMBER_FEATURES = [
  "Unlock full job details and employer info",
  "Unlimited one-click apply",
  "3 guaranteed employer interviews",
  "AI-built, ATS-approved resume",
  "Upskilling & certification access",
  "Priority support till you're hired",
];

export function isMembershipPlan(value: unknown): value is MembershipPlan {
  return MEMBERSHIP_PLANS.includes(value as MembershipPlan);
}

// The franchise price is only offered to candidates who signed up with a
// franchise partner's code; the database enforces the same rule.
export function plansFor(signUpCode: string | null): MembershipPlan[] {
  return signUpCode && isFranchiseCode(signUpCode)
    ? ["free", "member", "franchise"]
    : ["free", "member"];
}
