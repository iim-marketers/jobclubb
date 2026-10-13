import "server-only";

import { renderEmail, type EmailDetail } from "@/lib/email/layout";
import { GST_RATE, SUPPLIER, stateLabel } from "@/lib/gst";
import { formatIst } from "@/lib/interviews";
import type { MembershipInvoice } from "@/server/candidates/invoice";

export function membershipReceiptEmail({
  firstName,
  invoice,
  membershipUrl,
}: {
  firstName: string;
  invoice: MembershipInvoice;
  membershipUrl: string;
}) {
  const date = (iso: string) => formatIst(iso, { day: "numeric", month: "long", year: "numeric" });
  const money = (paise: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: invoice.currency,
      minimumFractionDigits: 2,
    }).format(paise / 100);
  const paid = money(invoice.amount);

  const tax: EmailDetail[] =
    invoice.igst > 0
      ? [{ label: `IGST (${GST_RATE}%)`, value: money(invoice.igst) }]
      : [
          { label: `CGST (${GST_RATE / 2}%)`, value: money(invoice.cgst) },
          { label: `SGST (${GST_RATE / 2}%)`, value: money(invoice.sgst) },
        ];

  return renderEmail({
    subject: `Invoice ${invoice.invoiceNumber} for your ${invoice.planName}`,
    preheader: `We received your payment of ${paid}. Your membership is active until ${date(invoice.validUntil)}.`,
    eyebrow: "Payment receipt",
    heading: "Payment received",
    greeting: `Dear ${firstName},`,
    paragraphs: [
      `Thank you for your payment. Your ${invoice.planName} is now active until ${date(invoice.validUntil)}.`,
      "Your GST tax invoice is attached as a PDF. You can also view it any time from the Billing section of your Membership page.",
    ],
    details: [
      { label: "Invoice number", value: invoice.invoiceNumber },
      { label: "Invoice date", value: date(invoice.issuedAt) },
      { label: "Plan", value: invoice.planName },
      { label: "Valid", value: `${date(invoice.validFrom)} to ${date(invoice.validUntil)}` },
      { label: "Taxable value", value: money(invoice.taxable) },
      ...tax,
      { label: "Total paid", value: paid },
      { label: "Place of supply", value: stateLabel(invoice.placeOfSupply) },
      { label: "Payment ID", value: invoice.paymentId },
    ],
    closing: [
      `Billed by ${SUPPLIER.legalName} (trading as ${SUPPLIER.brand}), GSTIN ${SUPPLIER.gstin}. Please keep this email for your records.`,
    ],
    cta: { label: "View membership", url: membershipUrl },
    footer: `You're receiving this because a payment was made for ${invoice.billedTo.email} on JobClubb.`,
  });
}
