import "server-only";

import { renderEmail, type EmailDetail } from "@/lib/email/layout";

type Change = { companyName: string; fieldLabel: string; oldValue: string | null; newValue: string };

const changeDetails = (c: Change): EmailDetail[] => [
  { label: "Field", value: c.fieldLabel },
  { label: "Current", value: c.oldValue ?? "Not set" },
  { label: "Requested", value: c.newValue },
];

export function changeRequestedInternalEmail({
  contactName,
  email,
  reason,
  adminUrl,
  ...change
}: Change & { contactName: string; email: string; reason: string; adminUrl: string }) {
  return renderEmail({
    subject: `Change requested: ${change.fieldLabel} for ${change.companyName}`,
    preheader: `${change.companyName} wants to change its ${change.fieldLabel.toLowerCase()}.`,
    eyebrow: "Company update",
    heading: "A company requested a change",
    greeting: "Dear Team,",
    paragraphs: [
      `${change.companyName} has asked to change its ${change.fieldLabel.toLowerCase()}. Review the request and approve or reject it from the admin panel.`,
    ],
    details: [
      { label: "Company", value: change.companyName },
      ...changeDetails(change),
      { label: "Reason", value: reason },
      { label: "Requested by", value: `${contactName} (${email})` },
    ],
    cta: { label: "Review request", url: adminUrl },
    footer: "Internal notification about a company account on JobClubb.",
  });
}

export function changeReviewedEmail({
  contactName,
  email,
  approved,
  adminNote,
  settingsUrl,
  ...change
}: Change & {
  contactName: string;
  email: string;
  approved: boolean;
  adminNote: string | null;
  settingsUrl: string;
}) {
  const field = change.fieldLabel.toLowerCase();
  return renderEmail({
    subject: approved
      ? `Your ${field} has been updated`
      : `We couldn't update your ${field}`,
    preheader: approved
      ? `Your ${field} on JobClubb is now ${change.newValue}.`
      : `Your request to change your ${field} wasn't approved.`,
    eyebrow: "Account update",
    heading: approved ? "Change approved" : "Change not approved",
    greeting: `Dear ${contactName.split(" ")[0]},`,
    paragraphs: approved
      ? [
          `We've reviewed your request and updated your ${field}. It now shows across your account and job postings.`,
        ]
      : [
          `We've reviewed your request to change your ${field} and weren't able to approve it.`,
          ...(adminNote ? [`Note from our team: ${adminNote}`] : []),
          "You can send a new request from your settings, or reply to this email if you have questions.",
        ],
    details: changeDetails(change),
    cta: { label: "Open settings", url: settingsUrl },
    footer: `You're receiving this because ${email} manages hiring on JobClubb.`,
  });
}
