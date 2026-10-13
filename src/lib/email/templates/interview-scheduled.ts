import "server-only";

import { renderEmail, type EmailDetail } from "@/lib/email/layout";
import {
  formatIst,
  modeLabel,
  venueText,
  type InterviewModeValue,
  type Venue,
} from "@/lib/interviews";

const INSTRUCTIONS: Record<InterviewModeValue, string> = {
  video: "Please join from a quiet place with a stable internet connection a few minutes before the scheduled time.",
  phone: "Please call the number above at the scheduled time.",
  in_person: "Please arrive 10 minutes before the scheduled time and carry a copy of your resume and a valid photo ID.",
};

export function interviewScheduledEmail({
  firstName,
  email,
  companyName,
  jobTitle,
  roundNo,
  round,
  startsAt,
  durationMins,
  mode,
  place,
  venue,
  interviewer,
  interviewsUrl,
  rescheduled,
}: {
  firstName: string;
  email: string;
  companyName: string;
  jobTitle: string;
  roundNo: number;
  round: string;
  startsAt: string;
  durationMins: number;
  mode: InterviewModeValue;
  place: string;
  venue: Venue | null;
  interviewer: string;
  interviewsUrl: string;
  rescheduled: boolean;
}) {
  const endsAt = new Date(Date.parse(startsAt) + durationMins * 60_000).toISOString();
  const time = (iso: string) => formatIst(iso, { hour: "numeric", minute: "2-digit" });

  const where: EmailDetail[] =
    mode === "video"
      ? [{ label: "Meeting link", value: place, href: place }]
      : mode === "phone"
        ? [{ label: "Number to call", value: place }]
        : [
            { label: "Venue", value: venue ? venueText(venue) : place },
            ...(venue?.landmark ? [{ label: "Landmark", value: venue.landmark }] : []),
          ];

  return renderEmail({
    subject: `Interview ${rescheduled ? "rescheduled" : "scheduled"}: ${jobTitle} at ${companyName}`,
    preheader: `Round ${roundNo} on ${formatIst(startsAt, { day: "numeric", month: "short" })} at ${time(startsAt)} IST.`,
    eyebrow: rescheduled ? "Interview rescheduled" : "Interview scheduled",
    heading: rescheduled ? "Your interview has been rescheduled" : "Your interview has been scheduled",
    greeting: `Dear ${firstName},`,
    paragraphs: [
      rescheduled
        ? `${companyName} has rescheduled your interview for the ${jobTitle} position. The updated details are below.`
        : `${companyName} has scheduled an interview with you for the ${jobTitle} position. The details are below.`,
    ],
    details: [
      { label: "Company", value: companyName },
      { label: "Position", value: jobTitle },
      { label: "Round", value: `Round ${roundNo}: ${round}` },
      {
        label: "Date",
        value: formatIst(startsAt, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      },
      { label: "Time", value: `${time(startsAt)} to ${time(endsAt)} IST (${durationMins} minutes)` },
      { label: "Mode", value: modeLabel(mode) },
      ...where,
      { label: "Interviewer", value: interviewer },
    ],
    closing: [INSTRUCTIONS[mode]],
    cta: { label: "View interview", url: interviewsUrl },
    footer: `You're receiving this because ${email} applied for this position on JobClubb.`,
  });
}
