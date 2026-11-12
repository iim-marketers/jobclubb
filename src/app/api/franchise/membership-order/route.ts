import { revalidatePath } from "next/cache";

import { CHECKOUT_PLAN, PLAN_DETAILS, isMembershipActive } from "@/lib/membership";
import { createMembershipOrder } from "@/server/candidates/membership";
import { getCurrentFranchise } from "@/server/franchises/current";
import { getFranchiseCandidate } from "@/server/franchises/membership";
import { RazorpayError } from "@/server/payments/razorpay";

const FAILED = "We couldn't start the payment. Please try again.";

export async function POST(request: Request) {
  const franchise = await getCurrentFranchise();
  if (!franchise)
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  if (franchise.status !== "active")
    return Response.json(
      { error: "Your franchise agreement isn't active, so you can't collect memberships right now." },
      { status: 403 },
    );

  const candidateId = new URL(request.url).searchParams.get("candidate") ?? "";
  try {
    const candidate = await getFranchiseCandidate(franchise.id, candidateId);
    if (!candidate)
      return Response.json(
        { error: "This candidate isn't on your list. Refresh to see the latest." },
        { status: 404 },
      );
    if (isMembershipActive(candidate.membership_expires_at)) {
      revalidatePath("/franchise/dashboard", "layout");
      return Response.json(
        { error: `${candidate.first_name}'s membership is already active.` },
        { status: 409 },
      );
    }

    const order = await createMembershipOrder({ ...candidate, plan: CHECKOUT_PLAN });
    if (!order) return Response.json({ error: FAILED }, { status: 500 });

    return Response.json({
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      description: `${PLAN_DETAILS[CHECKOUT_PLAN].name} for ${candidate.first_name} ${candidate.last_name}`,
    });
  } catch (err) {
    if (err instanceof RazorpayError && err.status !== 500) {
      return Response.json(
        { error: err.status === 401 ? "Payments are misconfigured. Please contact us." : err.message },
        { status: err.status },
      );
    }
    console.error("Creating franchise membership order failed", err);
    return Response.json({ error: FAILED }, { status: 500 });
  }
}
