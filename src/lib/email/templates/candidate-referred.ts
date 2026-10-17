import "server-only";

import { renderEmail } from "@/lib/email/layout";

export function candidateReferredEmail({
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
    subject: `Referred to ${companyName} for ${jobTitle}`,
    preheader: `JobClubb has referred you to ${companyName}. They'll schedule your interview next.`,
    eyebrow: "Referred to employer",
    heading: "You've been referred to the employer",
    greeting: `Dear ${firstName},`,
    paragraphs: [
      `Congratulations on clearing JobClubb's screening. We have referred you to ${companyName} for the ${jobTitle} position.`,
      "The employer can now see your name and profile, but not your phone number or email. Their interview will be scheduled shortly, and you will receive a separate email with the date, time and other details.",
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
