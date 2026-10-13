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
import {
  billingFor,
  getMembershipInvoice,
  gstColumns,
  invoiceFilename,
} from "@/server/candidates/invoice";
import { renderInvoicePdf } from "@/server/candidates/invoice-pdf";
import { createRazorpayOrder } from "@/server/payments/razorpay";

const CURRENCY = "INR";

export async function createMembershipOrder(candidate: {
  id: string;
  plan: MembershipPlan;
  first_name: string;
  last_name: string;
  city: string;
  pincode: string;
}) {
  const amount = PLAN_DETAILS[candidate.plan].amount * 100;
  const order = await createRazorpayOrder({
    amount,
    currency: CURRENCY,
    receipt: `membership_${Date.now()}`,
    notes: { candidate_id: candidate.id, plan: candidate.plan },
  });

  const billing = billingFor(candidate);
  const { error } = await createAdminClient().from("membership_payments").insert({
    order_id: order.id,
    candidate_id: candidate.id,
    plan: candidate.plan,
    amount,
    currency: CURRENCY,
    ...billing,
    ...gstColumns(amount, billing.place_of_supply),
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

  after(() => sendMembershipReceipt(candidateId, paymentId));

  return {
    invoiceNumber: payment.invoice_number,
    paidAt: payment.paid_at,
    expiresAt: expiresAt.toISOString(),
  };
}

async function sendMembershipReceipt(candidateId: string, paymentId: string) {
  const admin = createAdminClient();
  const { data: claimed, error: claimError } = await admin
    .from("membership_payments")
    .update({ receipt_sent_at: new Date().toISOString() })
    .eq("payment_id", paymentId)
    .eq("candidate_id", candidateId)
    .is("receipt_sent_at", null)
    .select("order_id")
    .maybeSingle();
  if (claimError) {
    console.error("Claiming membership receipt failed", claimError);
    return;
  }
  if (!claimed) return;

  try {
    const [invoice, { data: candidate, error }] = await Promise.all([
      getMembershipInvoice(candidateId, paymentId),
      admin
        .from("candidates")
        .select("first_name")
        .eq("id", candidateId)
        .single(),
    ]);
    if (error) throw error;
    if (!invoice) throw new Error(`No invoice for payment ${paymentId}`);

    const email = membershipReceiptEmail({
      firstName: candidate.first_name,
      invoice,
      membershipUrl: `${SITE_URL}${CANDIDATE_HOME}/membership`,
    });
    await sendEmail({
      to: invoice.billedTo.email,
      ...email,
      attachments: [
        ...email.attachments,
        {
          filename: invoiceFilename(invoice),
          content: await renderInvoicePdf(invoice),
          contentType: "application/pdf",
        },
      ],
    });
  } catch (error) {
    console.error("Sending membership receipt failed", error);
    const { error: releaseError } = await admin
      .from("membership_payments")
      .update({ receipt_sent_at: null })
      .eq("payment_id", paymentId);
    if (releaseError) console.error("Releasing membership receipt failed", releaseError);
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
