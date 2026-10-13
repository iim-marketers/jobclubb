import "server-only";

import { renderEmail } from "@/lib/email/layout";

export function applicationDeclinedEmail({
  firstName,
  email,
  companyName,
  jobTitle,
  afterInterview,
}: {
  firstName: string;
  email: string;
  companyName: string;
  jobTitle: string;
  afterInterview: boolean;
}) {
  const paragraphs = afterInterview
    ? [
        `Thank you for taking the time to interview for the ${jobTitle} position at ${companyName}.`,
        "After careful consideration, we regret to inform you that you have not been selected for this role. Hence, your application will not be taken further.",
        "We appreciate your interest and wish you all the best for your future endeavours.",
      ]
    : [
        `Thank you for taking the time to apply for the ${jobTitle} position at ${companyName}.`,
        "We regret to inform you that your profile does not match the requirements of this job opening. Hence, your application will not be taken further.",
        "We wish you all the best for your future endeavours.",
      ];

  return renderEmail({
    subject: `Update on your application for ${jobTitle} at ${companyName}`,
    preheader: `An update on your application for ${jobTitle} at ${companyName}.`,
    eyebrow: "Application update",
    heading: `Your application for ${jobTitle}`,
    greeting: `Dear ${firstName},`,
    paragraphs,
    footer: `You're receiving this because ${email} applied for this position on JobClubb.`,
  });
}
