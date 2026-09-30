import { getCurrentCandidate } from "@/server/auth/current-candidate";
import { confirmMembershipPayment } from "@/server/candidates/membership";
import { isValidPaymentSignature } from "@/server/payments/razorpay";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const field = (name: string) => {
    const value = (body as Record<string, unknown> | null)?.[name];
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };
  const orderId = field("razorpay_order_id");
  const paymentId = field("razorpay_payment_id");
  const signature = field("razorpay_signature");

  if (!orderId || !paymentId || !signature)
    return Response.json(
      { error: "Missing payment details." },
      { status: 400 },
    );

  const candidate = await getCurrentCandidate();
  if (!candidate)
    return Response.json({ error: "Please sign in again." }, { status: 401 });

  if (!isValidPaymentSignature({ orderId, paymentId, signature }))
    return Response.json(
      { error: "We couldn't verify this payment." },
      { status: 400 },
    );

  const result = await confirmMembershipPayment({
    candidateId: candidate.id,
    orderId,
    paymentId,
  });
  if (result === "unknown-order")
    return Response.json(
      { error: "This payment doesn't match your order." },
      { status: 400 },
    );
  if (result === "failed")
    return Response.json(
      {
        error:
          "Your payment went through but we couldn't activate your membership. Please contact us.",
      },
      { status: 500 },
    );

  return Response.json({ success: true });
}
