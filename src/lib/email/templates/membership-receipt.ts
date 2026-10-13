import "server-only";

import { renderEmail } from "@/lib/email/layout";
import { formatIst } from "@/lib/interviews";

export function membershipReceiptEmail({
  firstName,
  email,
  planName,
  amount,
  currency,
  invoiceNumber,
  paymentId,
  paidAt,
  expiresAt,
  membershipUrl,
}: {
  firstName: string;
  email: string;
  planName: string;
  amount: number;
  currency: string;
  invoiceNumber: string;
  paymentId: string;
  paidAt: string;
  expiresAt: string;
  membershipUrl: string;
}) {
  const date = (iso: string) => formatIst(iso, { day: "numeric", month: "long", year: "numeric" });
  const paid = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);

  return renderEmail({
    subject: `Payment receipt for your ${planName} (${invoiceNumber})`,
    preheader: `We received your payment of ${paid}. Your membership is active until ${date(expiresAt)}.`,
    eyebrow: "Payment receipt",
    heading: "Payment received",
    greeting: `Dear ${firstName},`,
    paragraphs: [
      `Thank you for your payment. Your ${planName} is now active until ${date(expiresAt)}.`,
    ],
    details: [
      { label: "Invoice number", value: invoiceNumber },
      { label: "Plan", value: planName },
      { label: "Amount paid", value: paid },
      { label: "Payment ID", value: paymentId },
      { label: "Paid on", value: `${date(paidAt)}, ${formatIst(paidAt, { hour: "numeric", minute: "2-digit" })} IST` },
      { label: "Valid until", value: date(expiresAt) },
    ],
    closing: ["Please keep this email for your records."],
    cta: { label: "View membership", url: membershipUrl },
    footer: `You're receiving this because a payment was made for ${email} on JobClubb.`,
  });
}
