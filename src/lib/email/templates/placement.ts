import "server-only";

import { renderEmail, type EmailDetail } from "@/lib/email/layout";
import { formatDateOnly } from "@/lib/placements";

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

export function offerSentEmail({
  firstName,
  email,
  jobTitle,
  companyName,
  joiningDate,
  applicationUrl,
}: Role & {
  firstName: string;
  email: string;
  joiningDate: string;
  applicationUrl: string;
}) {
  return renderEmail({
    subject: `Your offer letter for ${jobTitle} at ${companyName}`,
    preheader: `Your offer letter and joining details are ready on JobClubb.`,
    eyebrow: "Offer letter",
    heading: "Your offer letter is ready",
    greeting: `Dear ${firstName},`,
    paragraphs: [
      `Congratulations! As discussed with our placement team, ${companyName} has selected you for the ${jobTitle} position, and your offer letter and joining details are now on your application page.`,
      `You're expected to join on ${formatDateOnly(joiningDate)}. Read the offer letter carefully, and contact our placement team if anything in it looks wrong.`,
    ],
    details: [
      { label: "Position", value: jobTitle },
      { label: "Company", value: companyName },
      { label: "Joining date", value: formatDateOnly(joiningDate) },
    ],
    cta: { label: "View offer letter", url: applicationUrl },
    footer: `You're receiving this because ${email} was selected for a role on JobClubb.`,
  });
}

export function offerClosedForCandidateEmail({
  firstName,
  email,
  jobTitle,
  companyName,
}: Role & { firstName: string; email: string }) {
  return renderEmail({
    subject: `Update on your offer for ${jobTitle} at ${companyName}`,
    preheader: `${companyName} has withdrawn this offer.`,
    eyebrow: "Offer update",
    heading: "Your offer was withdrawn",
    greeting: `Dear ${firstName},`,
    paragraphs: [
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
