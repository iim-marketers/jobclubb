import { getCurrentCandidate } from "@/server/auth/current-candidate";
import { RazorpayError } from "@/server/payments/razorpay";
import { createPlacementOrder } from "@/server/placements/payments";

// Deliberately not requireMember: an offer can be claimed after membership ends.
export async function POST(_request: Request, ctx: RouteContext<"/api/placements/[id]/order">) {
  const candidate = await getCurrentCandidate();
  if (!candidate) return Response.json({ error: "Please sign in again." }, { status: 401 });

  const { id } = await ctx.params;
  try {
    const order = await createPlacementOrder(candidate, id);
    if (order === "not-payable")
      return Response.json(
        { error: "This offer is no longer open for payment. Refresh to see the latest." },
        { status: 409 },
      );
    if (!order)
      return Response.json(
        { error: "We couldn't start the payment. Please try again." },
        { status: 500 },
      );
    return Response.json({
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      description: order.description,
    });
  } catch (err) {
    if (err instanceof RazorpayError && err.status !== 500)
      return Response.json(
        {
          error:
            err.status === 401 ? "Payments are misconfigured. Please contact us." : err.message,
        },
        { status: err.status },
      );
    console.error("Creating placement order failed", err);
    return Response.json(
      { error: "We couldn't start the payment. Please try again." },
      { status: 500 },
    );
  }
}
