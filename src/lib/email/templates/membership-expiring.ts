import "server-only";

import { renderEmail } from "@/lib/email/layout";
import { formatIst } from "@/lib/interviews";

export function membershipExpiringEmail({
  firstName,
  email,
  planName,
  expiresAt,
  final,
  membershipUrl,
}: {
  firstName: string;
  email: string;
  planName: string;
  expiresAt: string;
  final: boolean;
  membershipUrl: string;
}) {
  const date = formatIst(expiresAt, { day: "numeric", month: "long", year: "numeric" });
  const time = formatIst(expiresAt, { hour: "numeric", minute: "2-digit" });
  const daysLeft = Math.max(1, Math.ceil((Date.parse(expiresAt) - Date.now()) / 86_400_000));
  const remaining = final ? "less than a day" : `${daysLeft} days`;

  return renderEmail({
    subject: final
      ? `Final reminder: your ${planName} expires on ${date}`
      : `Your ${planName} expires on ${date}`,
    preheader: `Your membership expires in ${remaining}, on ${date} at ${time} IST.`,
    eyebrow: final ? "Final reminder" : "Membership reminder",
    heading: `Your membership expires in ${remaining}`,
    greeting: `Dear ${firstName},`,
    paragraphs: [
      `This is a reminder that your ${planName} will expire on ${date} at ${time} IST.`,
      "After it expires, member benefits such as applying for jobs will not be available until you renew. You can renew from your Membership page once it has expired.",
    ],
    details: [
      { label: "Plan", value: planName },
      { label: "Valid until", value: `${date}, ${time} IST` },
    ],
    cta: { label: "View membership", url: membershipUrl },
    footer: `You're receiving this because ${email} has a membership on JobClubb.`,
  });
}
