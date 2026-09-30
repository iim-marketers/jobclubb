import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";

export const MIN_ORDER_AMOUNT = 100;

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret)
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set.");
  return { keyId, keySecret };
}

export class RazorpayError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function createRazorpayOrder(order: {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  if (!Number.isInteger(order.amount) || order.amount < MIN_ORDER_AMOUNT)
    throw new RazorpayError(`Amount must be at least ${MIN_ORDER_AMOUNT} paise.`, 400);

  const { keyId, keySecret } = credentials();
  try {
    return await new Razorpay({ key_id: keyId, key_secret: keySecret }).orders.create(order);
  } catch (err) {
    // The SDK rejects with { statusCode, error: { description } } rather than an Error.
    const { statusCode, error } = (err ?? {}) as {
      statusCode?: number;
      error?: { description?: string };
    };
    console.error("Creating Razorpay order failed", statusCode, error ?? err);
    throw new RazorpayError(
      error?.description ?? "Razorpay order creation failed.",
      statusCode === 401 ? 401 : 500,
    );
  }
}

export function isValidPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const expected = createHmac("sha256", credentials().keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
