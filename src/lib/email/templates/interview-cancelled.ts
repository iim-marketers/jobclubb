import "server-only";

import { renderEmail } from "@/lib/email/layout";
import { formatIst } from "@/lib/interviews";

export function interviewCancelledEmail({
  firstName,
  email,
  companyName,
  jobTitle,
  roundNo,
  round,
  startsAt,
  applicationUrl,
}: {
  firstName: string;
  email: string;
  companyName: string;
  jobTitle: string;
  roundNo: number;
  round: string;
  startsAt: string;
  applicationUrl: string;
}) {
  const date = formatIst(startsAt, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const time = formatIst(startsAt, { hour: "numeric", minute: "2-digit" });

  return renderEmail({
    subject: `Interview cancelled: ${jobTitle} at ${companyName}`,
    preheader: `Your interview on ${formatIst(startsAt, { day: "numeric", month: "short" })} has been cancelled.`,
    eyebrow: "Interview cancelled",
    heading: "Your interview has been cancelled",
    greeting: `Dear ${firstName},`,
    paragraphs: [
      `${companyName} has cancelled your interview for the ${jobTitle} position. The details of the cancelled interview are below.`,
    ],
    details: [
      { label: "Company", value: companyName },
      { label: "Position", value: jobTitle },
      { label: "Round", value: `Round ${roundNo}: ${round}` },
      { label: "Was scheduled for", value: `${date}, ${time} IST` },
    ],
    closing: [
      "Your application remains active. If a new interview is scheduled, you will receive a separate email with the details.",
    ],
    cta: { label: "View application", url: applicationUrl },
    footer: `You're receiving this because ${email} applied for this position on JobClubb.`,
  });
}
