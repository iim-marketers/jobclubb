import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { confirmMembershipPayment } from "@/server/candidates/membership";
import { getCurrentFranchise } from "@/server/franchises/current";
import { getFranchiseCandidate } from "@/server/franchises/membership";
import { sendWelcome } from "@/server/franchises/registration";
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
    return Response.json({ error: "Missing payment details." }, { status: 400 });

  // No active-agreement check here: a payment already taken must still activate.
  const franchise = await getCurrentFranchise();
  if (!franchise)
    return Response.json({ error: "Please sign in again." }, { status: 401 });

  if (!isValidPaymentSignature({ orderId, paymentId, signature }))
    return Response.json({ error: "We couldn't verify this payment." }, { status: 400 });

  const candidateId = new URL(request.url).searchParams.get("candidate") ?? "";
  const candidate = await getFranchiseCandidate(franchise.id, candidateId).catch((error) => {
    console.error("Loading franchise candidate failed", error);
    return null;
  });
  if (!candidate)
    return Response.json({ error: "This payment doesn't match the candidate's order." }, { status: 400 });

  const result = await confirmMembershipPayment({ candidateId: candidate.id, orderId, paymentId });
  if (result === "unknown-order")
    return Response.json({ error: "This payment doesn't match the candidate's order." }, { status: 400 });
  if (result === "failed")
    return Response.json(
      { error: "The payment went through but we couldn't activate the membership. Please contact us." },
      { status: 500 },
    );

  if (!candidate.membership_expires_at)
    after(() => sendWelcome(candidate.email, candidate.first_name, franchise.name));

  revalidatePath("/franchise/dashboard", "layout");
  revalidatePath("/admin", "layout");
  return Response.json({
    success: true,
    invoice_number: result.invoiceNumber,
    paid_at: result.paidAt,
    expires_at: result.expiresAt,
  });
}
