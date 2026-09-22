import "server-only";

import { MEMBERSHIP_DAYS, type MembershipPlan } from "@/lib/membership";
import { createAdminClient } from "@/lib/supabase/server";

// TODO: replace with Razorpay (create an order, verify the payment signature
// and webhook) and record each payment in its own table.
export const paymentsTestMode =
  process.env.NODE_ENV === "development" ||
  process.env.PAYMENTS_TEST_MODE === "true";

export async function activateMembership(
  candidateId: string,
  plan: MembershipPlan,
) {
  const paidAt = new Date();
  const expiresAt = new Date(paidAt);
  expiresAt.setDate(expiresAt.getDate() + MEMBERSHIP_DAYS);

  const { error } = await createAdminClient()
    .from("candidates")
    .update({
      membership_plan: plan,
      membership_paid_at: paidAt.toISOString(),
      membership_expires_at: expiresAt.toISOString(),
    })
    .eq("id", candidateId);

  if (error) console.error("Activating membership failed", error);
  return !error;
}
