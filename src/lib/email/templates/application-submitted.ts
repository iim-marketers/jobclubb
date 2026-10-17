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
    subject: `Application received: ${jobTitle} at ${companyName}`,
    preheader: `JobClubb has received your application for ${jobTitle} at ${companyName}.`,
    eyebrow: "Application received",
    heading: "We've received your application",
    greeting: `Dear ${firstName},`,
    paragraphs: [
      `Thank you for applying for the ${jobTitle} position at ${companyName}. The JobClubb team will review your profile and may invite you to a short screening interview.`,
      "If you're a good fit, we'll refer you to the employer, who then runs their own interviews. Your phone number and email are never shared with them. We will email you as soon as there is an update.",
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
