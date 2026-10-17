import "server-only";

import { renderEmail } from "@/lib/email/layout";

export function candidateReferralEmail({
  contactName,
  companyName,
  email,
  jobTitle,
  candidateName,
  experience,
  city,
  note,
  reviewUrl,
}: {
  contactName: string;
  companyName: string;
  email: string;
  jobTitle: string;
  candidateName: string;
  experience: string;
  city: string;
  note: string;
  reviewUrl: string;
}) {
  return renderEmail({
    subject: `New referral for ${jobTitle}: ${candidateName}`,
    preheader: `JobClubb has screened and referred ${candidateName} for ${jobTitle}.`,
    eyebrow: "New referral",
    heading: `JobClubb has referred a candidate for ${jobTitle}`,
    greeting: `Dear ${contactName},`,
    paragraphs: [
      `${candidateName} has cleared JobClubb's screening and first-round interview, and we are referring them to ${companyName} for the ${jobTitle} position.`,
      ...(note ? [`Our assessment: ${note}`] : []),
      "Please review their profile and schedule your interview. Selection is entirely at your discretion; let us know the outcome on JobClubb so we can keep the candidate informed.",
    ],
    details: [
      { label: "Candidate", value: candidateName },
      { label: "Position", value: jobTitle },
      { label: "Experience", value: experience },
      { label: "Location", value: city },
    ],
    cta: { label: "Review candidate", url: reviewUrl },
    footer: `You're receiving this because ${email} is the contact for ${companyName} on JobClubb.`,
  });
}
