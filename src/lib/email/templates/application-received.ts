import "server-only";

import { renderEmail } from "@/lib/email/layout";

export function applicationReceivedEmail({
  contactName,
  companyName,
  email,
  jobTitle,
  candidateLabel,
  experience,
  city,
  appliedOn,
  reviewUrl,
}: {
  contactName: string;
  companyName: string;
  email: string;
  jobTitle: string;
  candidateLabel: string;
  experience: string;
  city: string;
  appliedOn: string;
  reviewUrl: string;
}) {
  return renderEmail({
    subject: `New application for ${jobTitle} (${candidateLabel})`,
    preheader: `${candidateLabel} has applied for ${jobTitle}. Review the profile on JobClubb.`,
    eyebrow: "New application",
    heading: `A candidate has applied for ${jobTitle}`,
    greeting: `Dear ${contactName},`,
    paragraphs: [
      `A new application has been received for the ${jobTitle} position at ${companyName}.`,
      "The candidate's name and contact details remain confidential until you shortlist them.",
    ],
    details: [
      { label: "Candidate ID", value: candidateLabel },
      { label: "Position", value: jobTitle },
      { label: "Experience", value: experience },
      { label: "Location", value: city },
      { label: "Applied on", value: appliedOn },
    ],
    cta: { label: "Review application", url: reviewUrl },
    footer: `You're receiving this because ${email} is the contact for ${companyName} on JobClubb.`,
  });
}
