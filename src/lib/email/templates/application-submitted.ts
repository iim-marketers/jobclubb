import "server-only";

import { renderEmail } from "@/lib/email/layout";

export function applicationSubmittedEmail({
  firstName,
  email,
  companyName,
  jobTitle,
  applicationRef,
  appliedOn,
  applicationUrl,
}: {
  firstName: string;
  email: string;
  companyName: string;
  jobTitle: string;
  applicationRef: string;
  appliedOn: string;
  applicationUrl: string;
}) {
  return renderEmail({
    subject: `Application sent: ${jobTitle} at ${companyName}`,
    preheader: `Your application for ${jobTitle} has been sent to ${companyName}.`,
    eyebrow: "Application sent",
    heading: "Your application has been sent",
    greeting: `Dear ${firstName},`,
    paragraphs: [
      `Thank you for applying for the ${jobTitle} position at ${companyName}. Your application has been shared with the employer for review.`,
      "Your name and contact details stay confidential until the employer shortlists you. We will email you as soon as there is an update.",
    ],
    details: [
      { label: "Company", value: companyName },
      { label: "Position", value: jobTitle },
      { label: "Application ID", value: applicationRef },
      { label: "Applied on", value: appliedOn },
    ],
    cta: { label: "View application", url: applicationUrl },
    footer: `You're receiving this because ${email} applied for this position on JobClubb.`,
  });
}
