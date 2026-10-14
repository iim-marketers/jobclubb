import "server-only";

import { after } from "next/server";

import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { sendEmail } from "@/lib/email/mailer";
import { offerUnlockedEmail } from "@/lib/email/templates/placement";
import { PLACEMENT_SAC } from "@/lib/gst";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/server";
import { billingFor, gstColumns, invoiceFilename, type Invoice } from "@/server/candidates/invoice";
import { renderInvoicePdf } from "@/server/candidates/invoice-pdf";
import { createRazorpayOrder } from "@/server/payments/razorpay";
import { sendLatePaymentAlert, sendPlacementPaid } from "@/server/placements/emails";
import { effectiveStatus } from "@/server/placements/placements";

const CURRENCY = "INR";
const UUID = /^[0-9a-f-]{36}$/i;

export type PlacementOrder =
  | { orderId: string; amount: number; currency: string; description: string }
  | "not-payable";

export async function createPlacementOrder(
  candidate: { id: string; first_name: string; last_name: string; city: string; pincode: string },
  placementId: string,
): Promise<PlacementOrder | null> {
  if (!UUID.test(placementId)) return "not-payable";
  const admin = createAdminClient();
  const { data: placement, error } = await admin
    .from("placements")
    .select("status, offer_deadline, fee_amount, job_applications (job_title, company_name)")
    .eq("id", placementId)
    .eq("candidate_id", candidate.id)
    .maybeSingle();
  if (error) throw error;
  if (!placement?.fee_amount || effectiveStatus(placement) !== "released") return "not-payable";

  const job = placement.job_applications as unknown as { job_title: string; company_name: string };
  const amount = placement.fee_amount;
  const order = await createRazorpayOrder({
    amount,
    currency: CURRENCY,
    receipt: `placement_${Date.now()}`,
    notes: { candidate_id: candidate.id, placement_id: placementId },
  });

  const billing = billingFor(candidate);
  const { error: insertError } = await admin.from("placement_payments").insert({
    order_id: order.id,
    placement_id: placementId,
    candidate_id: candidate.id,
    amount,
    currency: CURRENCY,
    ...billing,
    ...gstColumns(amount, billing.place_of_supply),
  });
  if (insertError) {
    console.error("Recording placement order failed", insertError);
    return null;
  }
  return {
    orderId: order.id,
    amount,
    currency: CURRENCY,
    description: `Placement fee: ${job.job_title} at ${job.company_name}`,
  };
}

export type ConfirmPlacementResult =
  | { invoiceNumber: string; paidAt: string; accepted: boolean }
  | "unknown-order"
  | "failed";

// Call only after the Razorpay signature has been verified.
export async function confirmPlacementPayment({
  candidateId,
  orderId,
  paymentId,
}: {
  candidateId: string;
  orderId: string;
  paymentId: string;
}): Promise<ConfirmPlacementResult> {
  const admin = createAdminClient();
  const { data: marked, error: markError } = await admin
    .rpc("mark_placement_paid", {
      p_order_id: orderId,
      p_candidate_id: candidateId,
      p_payment_id: paymentId,
    })
    .select("placement_id, paid_at, invoice_number")
    .maybeSingle();
  if (markError) {
    console.error("Recording placement payment failed", markError);
    return "failed";
  }

  let payment = marked;
  if (!payment) {
    const { data: existing } = await admin
      .from("placement_payments")
      .select("placement_id, paid_at, invoice_number, payment_id")
      .eq("order_id", orderId)
      .eq("candidate_id", candidateId)
      .eq("status", "paid")
      .maybeSingle();
    if (existing?.payment_id !== paymentId) return "unknown-order";
    payment = existing;
  }
  if (!payment.paid_at || !payment.invoice_number) return "failed";

  const { data: placement } = await admin
    .from("placements")
    .select("accepted_at")
    .eq("id", payment.placement_id)
    .single();
  // mark_placement_paid stamps both with the same time, so a second payment
  // for an offer that's already been paid doesn't count as accepting it.
  const accepted =
    !!placement?.accepted_at && Date.parse(placement.accepted_at) === Date.parse(payment.paid_at);
  if (!accepted)
    console.error("Placement fee paid for an offer that is no longer open", payment.placement_id, paymentId);

  after(() => sendPlacementReceipt(candidateId, paymentId, payment.placement_id, accepted));

  return { invoiceNumber: payment.invoice_number, paidAt: payment.paid_at, accepted };
}

export async function confirmPlacementPaymentForOrder({
  orderId,
  paymentId,
}: {
  orderId: string;
  paymentId: string;
}): Promise<ConfirmPlacementResult> {
  const { data: order, error } = await createAdminClient()
    .from("placement_payments")
    .select("candidate_id")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) {
    console.error("Loading placement order failed", error);
    return "failed";
  }
  if (!order) return "unknown-order";
  return confirmPlacementPayment({ candidateId: order.candidate_id, orderId, paymentId });
}

// The browser callback and the webhook can both confirm; whichever claims the
// receipt first sends it and the notifications, so each goes out once.
async function sendPlacementReceipt(
  candidateId: string,
  paymentId: string,
  placementId: string,
  accepted: boolean,
) {
  const admin = createAdminClient();
  const { data: claimed, error: claimError } = await admin
    .from("placement_payments")
    .update({ receipt_sent_at: new Date().toISOString() })
    .eq("payment_id", paymentId)
    .eq("candidate_id", candidateId)
    .is("receipt_sent_at", null)
    .select("order_id")
    .maybeSingle();
  if (claimError) {
    console.error("Claiming placement receipt failed", claimError);
    return;
  }
  if (!claimed) return;
  if (!accepted) {
    await sendLatePaymentAlert(placementId, paymentId);
    return;
  }

  try {
    const invoice = await getPlacementInvoice(candidateId, paymentId);
    if (!invoice) throw new Error(`No invoice for placement payment ${paymentId}`);
    const email = offerUnlockedEmail({
      firstName: invoice.firstName,
      jobTitle: invoice.jobTitle,
      companyName: invoice.companyName,
      joiningDate: invoice.joiningDate,
      invoice,
      applicationUrl: `${SITE_URL}${CANDIDATE_HOME}/applications/${invoice.applicationRef}`,
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
    console.error("Sending placement receipt failed", error);
    const { error: releaseError } = await admin
      .from("placement_payments")
      .update({ receipt_sent_at: null })
      .eq("payment_id", paymentId);
    if (releaseError) console.error("Releasing placement receipt failed", releaseError);
    return;
  }
  await sendPlacementPaid(placementId);
}

type PlacementInvoice = Invoice & {
  firstName: string;
  jobTitle: string;
  companyName: string;
  joiningDate: string;
  applicationRef: string;
};

export async function getPlacementInvoice(
  candidateId: string,
  paymentId: string,
): Promise<PlacementInvoice | null> {
  const { data, error } = await createAdminClient()
    .from("placement_payments")
    .select(
      "invoice_number, payment_id, amount, currency, paid_at, billing_name, billing_city, billing_pincode, place_of_supply, taxable_amount, cgst_amount, sgst_amount, igst_amount, candidates (first_name, email), placements (joining_date, job_applications (ref, job_title, company_name))",
    )
    .eq("candidate_id", candidateId)
    .eq("payment_id", paymentId)
    .eq("status", "paid")
    .maybeSingle();
  if (error) throw error;
  if (!data?.invoice_number || !data.payment_id || !data.paid_at) return null;

  const candidate = data.candidates as unknown as { first_name: string; email: string };
  const placement = data.placements as unknown as {
    joining_date: string;
    job_applications: { ref: string; job_title: string; company_name: string };
  } | null;
  if (!placement) return null;
  const job = placement.job_applications;
  return {
    taxable: data.taxable_amount,
    cgst: data.cgst_amount,
    sgst: data.sgst_amount,
    igst: data.igst_amount,
    invoiceNumber: data.invoice_number,
    issuedAt: data.paid_at,
    paymentId: data.payment_id,
    item: {
      name: "Placement service fee",
      detail: `${job.job_title} at ${job.company_name}`,
      sac: PLACEMENT_SAC,
    },
    amount: data.amount,
    currency: data.currency,
    placeOfSupply: data.place_of_supply,
    billedTo: {
      name: data.billing_name,
      email: candidate.email,
      city: data.billing_city,
      pincode: data.billing_pincode,
    },
    firstName: candidate.first_name,
    jobTitle: job.job_title,
    companyName: job.company_name,
    joiningDate: placement.joining_date,
    applicationRef: job.ref,
  };
}

export async function getPlacementPaymentForCandidate(candidateId: string, placementId: string) {
  const { data, error } = await createAdminClient()
    .from("placement_payments")
    .select("payment_id, invoice_number, amount, paid_at")
    .eq("candidate_id", candidateId)
    .eq("placement_id", placementId)
    .eq("status", "paid")
    .order("paid_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data && data.payment_id && data.invoice_number && data.paid_at
    ? {
        paymentId: data.payment_id as string,
        invoiceNumber: data.invoice_number as string,
        amount: data.amount as number,
        paidAt: data.paid_at as string,
      }
    : null;
}
