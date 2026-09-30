import { isMembershipActive, planFor } from "@/lib/membership";
import { getCurrentCandidate } from "@/server/auth/current-candidate";
import { createMembershipOrder } from "@/server/candidates/membership";
import { RazorpayError } from "@/server/payments/razorpay";

export async function POST() {
  const candidate = await getCurrentCandidate();
  if (!candidate)
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  if (isMembershipActive(candidate.membership_expires_at))
    return Response.json(
      { error: "Your membership is already active." },
      { status: 409 },
    );

  try {
    const order = await createMembershipOrder({
      id: candidate.id,
      plan: planFor(candidate.code),
    });
    if (!order)
      return Response.json(
        { error: "We couldn't start the payment. Please try again." },
        { status: 500 },
      );

    return Response.json({
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    if (err instanceof RazorpayError && err.status !== 500) {
      return Response.json(
        {
          error:
            err.status === 401
              ? "Payments are misconfigured. Please contact us."
              : err.message,
        },
        { status: err.status },
      );
    }
    console.error("Creating membership order failed", err);
    return Response.json(
      { error: "We couldn't start the payment. Please try again." },
      { status: 500 },
    );
  }
}
