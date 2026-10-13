import "server-only";

import { after } from "next/server";

import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { sendEmail } from "@/lib/email/mailer";
import { membershipReceiptEmail } from "@/lib/email/templates/membership-receipt";
import {
  MEMBERSHIP_DAYS,
  PLAN_DETAILS,
  isMembershipPlan,
  type MembershipPlan,
} from "@/lib/membership";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/server";
import { createRazorpayOrder } from "@/server/payments/razorpay";

const CURRENCY = "INR";

export async function createMembershipOrder(candidate: {
  id: string;
  plan: MembershipPlan;
}) {
  const amount = PLAN_DETAILS[candidate.plan].amount * 100;
  const order = await createRazorpayOrder({
    amount,
    currency: CURRENCY,
    receipt: `membership_${Date.now()}`,
    notes: { candidate_id: candidate.id, plan: candidate.plan },
  });

  const { error } = await createAdminClient().from("membership_payments").insert({
    order_id: order.id,
    candidate_id: candidate.id,
    plan: candidate.plan,
    amount,
    currency: CURRENCY,
  });
  if (error) {
    console.error("Recording Razorpay order failed", error);
    return null;
  }

  return { orderId: order.id, amount, currency: CURRENCY };
}

export type ConfirmedPayment = {
  invoiceNumber: string;
  paidAt: string;
  expiresAt: string;
};

export type ConfirmPaymentResult = ConfirmedPayment | "unknown-order" | "failed";

// Call only after the Razorpay signature has been verified.
export async function confirmMembershipPayment({
  candidateId,
  orderId,
  paymentId,
}: {
  candidateId: string;
  orderId: string;
  paymentId: string;
}): Promise<ConfirmPaymentResult> {
  const admin = createAdminClient();

  const { data: marked, error: markError } = await admin
    .rpc("mark_membership_paid", {
      p_order_id: orderId,
      p_candidate_id: candidateId,
      p_payment_id: paymentId,
    })
    .select("plan, paid_at, invoice_number, amount, currency")
    .maybeSingle();
  if (markError) {
    console.error("Recording Razorpay payment failed", markError);
    return "failed";
  }

  let payment = marked;
  if (!payment) {
    const { data: existing } = await admin
      .from("membership_payments")
      .select("plan, paid_at, payment_id, invoice_number, amount, currency")
      .eq("order_id", orderId)
      .eq("candidate_id", candidateId)
      .eq("status", "paid")
      .maybeSingle();
    if (existing?.payment_id !== paymentId) return "unknown-order";
    payment = existing;
  }

  if (
    !isMembershipPlan(payment.plan) ||
    !payment.paid_at ||
    !payment.invoice_number
  )
    return "failed";
  const expiresAt = await activateMembership(
    candidateId,
    payment.plan,
    new Date(payment.paid_at),
  );
  if (!expiresAt) return "failed";

  // Only the call that marked the order paid gets a row back, so the browser
  // callback and the webhook can't both send a receipt.
  if (marked) {
    const receipt = {
      candidateId,
      plan: payment.plan,
      amount: payment.amount,
      currency: payment.currency,
      invoiceNumber: payment.invoice_number,
      paymentId,
      paidAt: payment.paid_at,
      expiresAt: expiresAt.toISOString(),
    };
    after(() => sendMembershipReceipt(receipt));
  }

  return {
    invoiceNumber: payment.invoice_number,
    paidAt: payment.paid_at,
    expiresAt: expiresAt.toISOString(),
  };
}

async function sendMembershipReceipt(receipt: {
  candidateId: string;
  plan: MembershipPlan;
  amount: number;
  currency: string;
  invoiceNumber: string;
  paymentId: string;
  paidAt: string;
  expiresAt: string;
}) {
  try {
    const { data: candidate, error } = await createAdminClient()
      .from("candidates")
      .select("first_name, email")
      .eq("id", receipt.candidateId)
      .single();
    if (error) throw error;
    await sendEmail({
      to: candidate.email,
      ...membershipReceiptEmail({
        firstName: candidate.first_name,
        email: candidate.email,
        planName: PLAN_DETAILS[receipt.plan].name,
        amount: receipt.amount,
        currency: receipt.currency,
        invoiceNumber: receipt.invoiceNumber,
        paymentId: receipt.paymentId,
        paidAt: receipt.paidAt,
        expiresAt: receipt.expiresAt,
        membershipUrl: `${SITE_URL}${CANDIDATE_HOME}/membership`,
      }),
    });
  } catch (error) {
    console.error("Sending membership receipt failed", error);
  }
}

export async function confirmMembershipPaymentForOrder({
  orderId,
  paymentId,
}: {
  orderId: string;
  paymentId: string;
}): Promise<ConfirmPaymentResult> {
  const { data: order, error } = await createAdminClient()
    .from("membership_payments")
    .select("candidate_id")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) {
    console.error("Loading membership order failed", error);
    return "failed";
  }
  if (!order) return "unknown-order";
  return confirmMembershipPayment({
    candidateId: order.candidate_id,
    orderId,
    paymentId,
  });
}

async function activateMembership(
  candidateId: string,
  plan: MembershipPlan,
  paidAt: Date,
) {
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

  if (error) {
    console.error("Activating membership failed", error);
    return null;
  }
  return expiresAt;
}

export type MembershipPayment = {
  invoiceNumber: string;
  paymentId: string;
  plan: MembershipPlan;
  amount: number;
  currency: string;
  paidAt: string;
};

export async function getMembershipPayments(
  candidateId: string,
): Promise<MembershipPayment[]> {
  const { data, error } = await createAdminClient()
    .from("membership_payments")
    .select("invoice_number, payment_id, plan, amount, currency, paid_at")
    .eq("candidate_id", candidateId)
    .eq("status", "paid")
    .order("paid_at", { ascending: false });
  if (error) console.error("Loading membership payments failed", error);

  return (data ?? []).flatMap((row) =>
    isMembershipPlan(row.plan) && row.invoice_number && row.payment_id && row.paid_at
      ? [
          {
            invoiceNumber: row.invoice_number,
            paymentId: row.payment_id,
            plan: row.plan,
            amount: row.amount,
            currency: row.currency,
            paidAt: row.paid_at,
          },
        ]
      : [],
  );
}
