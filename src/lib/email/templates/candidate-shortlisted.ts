import "server-only";

import { renderEmail } from "@/lib/email/layout";

export function candidateShortlistedEmail({
  firstName,
  email,
  companyName,
  jobTitle,
  applicationRef,
  applicationUrl,
}: {
  firstName: string;
  email: string;
  companyName: string;
  jobTitle: string;
  applicationRef: string;
  applicationUrl: string;
}) {
  return renderEmail({
    subject: `Shortlisted for ${jobTitle} at ${companyName}`,
    preheader: `${companyName} has shortlisted your application. Your interview will be scheduled shortly.`,
    eyebrow: "Application shortlisted",
    heading: "You have been shortlisted",
    greeting: `Dear ${firstName},`,
    paragraphs: [
      `We are pleased to inform you that ${companyName} has shortlisted your application for the ${jobTitle} position.`,
      "The next step is an interview. It will be scheduled shortly, and you will receive a separate email with the date, time and other details.",
    ],
    details: [
      { label: "Company", value: companyName },
      { label: "Position", value: jobTitle },
      { label: "Application ID", value: applicationRef },
    ],
    cta: { label: "View application", url: applicationUrl },
    footer: `You're receiving this because ${email} applied for this position on JobClubb.`,
  });
}
