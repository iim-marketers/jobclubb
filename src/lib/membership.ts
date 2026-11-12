// "franchise" was a cheaper plan for franchise-code sign-ups. It is no longer sold,
// but invoices issued under it still need its name.
export const PAID_PLANS = ["member", "franchise"] as const;
export type PaidPlan = (typeof PAID_PLANS)[number];

// Emporium students join with a batch code and never pay for their first year.
export const MEMBERSHIP_PLANS = [...PAID_PLANS, "emporium"] as const;
export type MembershipPlan = (typeof MEMBERSHIP_PLANS)[number];

export const PLAN_DETAILS: Record<
  MembershipPlan,
  { name: string; badge: string; price: string; amount: number }
> = {
  member: {
    name: "JobClubb Membership",
    badge: "Member",
    price: "₹1,499",
    amount: 1499,
  },
  franchise: {
    name: "Franchise Membership",
    badge: "Member",
    price: "₹1,199",
    amount: 1199,
  },
  emporium: {
    name: "Emporium Membership",
    badge: "Emporium",
    price: "Included",
    amount: 0,
  },
};

export const MEMBERSHIP_DAYS = 365;

export const RENEWAL_REMINDER_DAYS = 15;

export const CHECKOUT_PATH = "/onboarding/membership";

export const INTERVIEW_GRACE_DAYS = 3;

export const MEMBER_FEATURES = [
  "Full job details and employer info",
  "Unlimited one-click apply",
  "3 guaranteed employer interviews",
  "AI-built, ATS-approved resume",
  // "Upskilling & certification access",
  "Priority support till you're hired",
];

export function isMembershipPlan(value: unknown): value is MembershipPlan {
  return MEMBERSHIP_PLANS.includes(value as MembershipPlan);
}

// Every candidate, including franchise candidates and renewing Emporium members,
// pays the standard price.
export const CHECKOUT_PLAN: PaidPlan = "member";

export function isMembershipActive(expiresAt: string | null | undefined) {
  return !!expiresAt && new Date(expiresAt).getTime() > Date.now();
}
