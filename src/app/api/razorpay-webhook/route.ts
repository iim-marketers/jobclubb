import { confirmMembershipPaymentForOrder } from "@/server/candidates/membership";
import { isValidWebhookSignature } from "@/server/payments/razorpay";

type OrderPaidEvent = {
  event: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string } };
  };
};

export async function POST(request: Request) {
  // The signature covers the exact bytes sent, so verify before parsing.
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature || !isValidWebhookSignature(body, signature))
    return Response.json({ error: "Invalid signature." }, { status: 400 });

  let event: OrderPaidEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }
  if (event.event !== "order.paid") return Response.json({ ignored: true });

  const payment = event.payload?.payment?.entity;
  if (!payment?.id || !payment.order_id)
    return Response.json({ error: "Missing payment details." }, { status: 400 });

  const result = await confirmMembershipPaymentForOrder({
    orderId: payment.order_id,
    paymentId: payment.id,
  });
  if (result === "failed")
    return Response.json({ error: "Activation failed." }, { status: 500 });
  if (result === "unknown-order")
    console.warn("Razorpay webhook for unknown order", payment.order_id, payment.id);

  return Response.json({ received: true });
}
