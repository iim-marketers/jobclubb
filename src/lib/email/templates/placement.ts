import "server-only";

import { renderEmail, type EmailDetail } from "@/lib/email/layout";
import { GST_RATE, SUPPLIER, stateLabel } from "@/lib/gst";
import { formatIst } from "@/lib/interviews";
import { formatDateOnly, formatRupees } from "@/lib/placements";
import type { Invoice } from "@/server/candidates/invoice";

type Role = { jobTitle: string; companyName: string };

export function placementInternalEmail({
  subject,
  heading,
  paragraphs,
  details,
  adminUrl,
}: {
  subject: string;
  heading: string;
  paragraphs: string[];
  details: EmailDetail[];
  adminUrl: string;
}) {
  return renderEmail({
    subject,
    preheader: paragraphs[0],
    eyebrow: "Placement update",
    heading,
    greeting: "Dear Placement Team,",
    paragraphs,
    details,
    cta: { label: "Open placement", url: adminUrl },
    footer: "Internal notification about a placement on JobClubb.",
  });
}

export function offerReleasedEmail({
  firstName,
  email,
  jobTitle,
  companyName,
  fee,
  deadline,
  joiningDate,
  applicationUrl,
}: Role & {
  firstName: string;
  email: string;
  fee: number;
  deadline: string;
  joiningDate: string;
  applicationUrl: string;
}) {
  return renderEmail({
    subject: `Congratulations! You've been selected for ${jobTitle} at ${companyName}`,
    preheader: `Pay the placement fee by ${formatDateOnly(deadline)} to receive your offer letter.`,
    eyebrow: "You've been selected",
    heading: `You're selected for ${jobTitle}`,
    greeting: `Dear ${firstName},`,
    paragraphs: [
      `Congratulations! ${companyName} has selected you for the ${jobTitle} position, and your offer letter is ready with JobClubb.`,
      `To receive your offer letter and joining details, pay the placement fee of ${formatRupees(fee)} by ${formatDateOnly(deadline)}. As agreed in our terms, the fee equals one month's fixed gross salary for this role, with GST included.`,
      "If you'd rather not take up this offer, you can decline it from the same page at no cost. Someone from our placement team will also call you to talk you through it.",
    ],
    details: [
      { label: "Position", value: jobTitle },
      { label: "Company", value: companyName },
      { label: "Expected joining", value: formatDateOnly(joiningDate) },
      { label: "Placement fee", value: formatRupees(fee) },
      { label: "Pay by", value: formatDateOnly(deadline) },
    ],
    closing: ["The offer lapses if the fee isn't paid by the deadline, and the fee is non-refundable once paid."],
    cta: { label: "Pay & unlock offer", url: applicationUrl },
    footer: `You're receiving this because ${email} was selected for a role on JobClubb.`,
  });
}

export function offerPaymentReminderEmail({
  firstName,
  email,
  jobTitle,
  companyName,
  fee,
  deadline,
  final,
  applicationUrl,
}: Role & {
  firstName: string;
  email: string;
  fee: number;
  deadline: string;
  final: boolean;
  applicationUrl: string;
}) {
  const by = formatDateOnly(deadline);
  return renderEmail({
    subject: final
      ? `Last day to claim your offer for ${jobTitle}`
      : `Reminder: claim your offer for ${jobTitle} by ${by}`,
    preheader: `Pay the placement fee of ${formatRupees(fee)} by ${by} to receive your offer letter.`,
    eyebrow: final ? "Offer closing" : "Offer reminder",
    heading: final ? "Your offer closes tonight" : "Your offer is waiting",
    greeting: `Dear ${firstName},`,
    paragraphs: [
      `Your offer for ${jobTitle} at ${companyName} is still waiting. Pay the placement fee of ${formatRupees(fee)} by ${by} to receive your offer letter and joining details.`,
      final
        ? "If the fee isn't paid by midnight tonight, the offer lapses."
        : "If you've decided not to take it up, you can decline it from the same page.",
    ],
    cta: { label: "Pay & unlock offer", url: applicationUrl },
    footer: `You're receiving this because ${email} was selected for a role on JobClubb.`,
  });
}

export function offerUnlockedEmail({
  firstName,
  jobTitle,
  companyName,
  joiningDate,
  invoice,
  applicationUrl,
}: Role & {
  firstName: string;
  joiningDate: string;
  invoice: Invoice;
  applicationUrl: string;
}) {
  const money = (paise: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: invoice.currency,
      minimumFractionDigits: 2,
    }).format(paise / 100);
  const tax: EmailDetail[] =
    invoice.igst > 0
      ? [{ label: `IGST (${GST_RATE}%)`, value: money(invoice.igst) }]
      : [
          { label: `CGST (${GST_RATE / 2}%)`, value: money(invoice.cgst) },
          { label: `SGST (${GST_RATE / 2}%)`, value: money(invoice.sgst) },
        ];

  return renderEmail({
    subject: `Your offer letter for ${jobTitle} is unlocked`,
    preheader: `Payment received. Your offer letter and joining details are ready.`,
    eyebrow: "Offer unlocked",
    heading: "Your offer letter is ready",
    greeting: `Dear ${firstName},`,
    paragraphs: [
      `Thank you for your payment. Your offer for ${jobTitle} at ${companyName} is confirmed, and your offer letter and joining details are now on your application page.`,
      `You're expected to join on ${formatDateOnly(joiningDate)}. Your GST tax invoice is attached as a PDF.`,
    ],
    details: [
      { label: "Invoice number", value: invoice.invoiceNumber },
      { label: "Invoice date", value: formatIst(invoice.issuedAt, { day: "numeric", month: "long", year: "numeric" }) },
      { label: "Taxable value", value: money(invoice.taxable) },
      ...tax,
      { label: "Total paid", value: money(invoice.amount) },
      { label: "Place of supply", value: stateLabel(invoice.placeOfSupply) },
      { label: "Payment ID", value: invoice.paymentId },
    ],
    closing: [
      `Billed by ${SUPPLIER.legalName} (trading as ${SUPPLIER.brand}), GSTIN ${SUPPLIER.gstin}. Please keep this email for your records.`,
    ],
    cta: { label: "View offer letter", url: applicationUrl },
    footer: `You're receiving this because a payment was made for ${invoice.billedTo.email} on JobClubb.`,
  });
}

export function offerClosedForCandidateEmail({
  firstName,
  email,
  jobTitle,
  companyName,
  reason,
}: Role & { firstName: string; email: string; reason: "expired" | "withdrawn" }) {
  return renderEmail({
    subject:
      reason === "expired"
        ? `Your offer for ${jobTitle} has lapsed`
        : `Update on your offer for ${jobTitle} at ${companyName}`,
    preheader:
      reason === "expired"
        ? "The deadline to claim this offer has passed."
        : `${companyName} has withdrawn this offer.`,
    eyebrow: "Offer update",
    heading: reason === "expired" ? "Your offer has lapsed" : "Your offer was withdrawn",
    greeting: `Dear ${firstName},`,
    paragraphs:
      reason === "expired"
        ? [
            `The deadline to claim your offer for ${jobTitle} at ${companyName} has passed, so the offer has lapsed.`,
            "If you think this is a mistake, reply to this email or contact our placement team as soon as possible.",
          ]
        : [
            `We're sorry to tell you that ${companyName} has withdrawn its offer for the ${jobTitle} position.`,
            "Our placement team will be in touch. In the meantime, new roles are added every day, so keep applying.",
          ],
    footer: `You're receiving this because ${email} was selected for a role on JobClubb.`,
  });
}

export function placementCompanyEmail({
  contactName,
  email,
  subject,
  heading,
  paragraphs,
  details,
  cta,
}: {
  contactName: string;
  email: string;
  subject: string;
  heading: string;
  paragraphs: string[];
  details?: EmailDetail[];
  cta: { label: string; url: string };
}) {
  return renderEmail({
    subject,
    preheader: paragraphs[0],
    eyebrow: "Selected candidate",
    heading,
    greeting: `Dear ${contactName.split(" ")[0]},`,
    paragraphs,
    details,
    cta,
    footer: `You're receiving this because ${email} manages hiring on JobClubb.`,
  });
}
