import "server-only";

import { renderEmail, type EmailDetail } from "@/lib/email/layout";
import {
  formatIst,
  modeLabel,
  venueText,
  type InterviewModeValue,
  type Venue,
} from "@/lib/interviews";

export type InterviewEmailKind = "scheduled" | "rescheduled" | "reminder";

export const interviewWith = (companyName: string, jobclubb: boolean) =>
  jobclubb ? "JobClubb" : companyName;

const INSTRUCTIONS: Record<InterviewModeValue, string> = {
  video: "Please join from a quiet place with a stable internet connection a few minutes before the scheduled time.",
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
  kind,
  jobclubb = false,
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
  kind: InterviewEmailKind;
  jobclubb?: boolean;
}) {
  const host = interviewWith(companyName, jobclubb);
  const what = jobclubb ? "screening interview" : "interview";
  const endsAt = new Date(Date.parse(startsAt) + durationMins * 60_000).toISOString();
  const time = (iso: string) => formatIst(iso, { hour: "numeric", minute: "2-digit" });
  const shortDate = formatIst(startsAt, { weekday: "short", day: "numeric", month: "short" });

  const where: EmailDetail[] =
    mode === "video"
      ? [{ label: "Meeting link", value: place, href: place }]
      : [
          { label: "Venue", value: venue ? venueText(venue) : place },
          ...(venue?.landmark ? [{ label: "Landmark", value: venue.landmark }] : []),
        ];

  const copy = {
    scheduled: {
      subject: `Interview scheduled: ${jobTitle} at ${companyName}`,
      eyebrow: "Interview scheduled",
      heading: `Your ${what} has been scheduled`,
      intro: `${host} has scheduled a${jobclubb ? " screening" : "n"} interview with you for the ${jobTitle} position${jobclubb ? ` at ${companyName}` : ""}. The details are below.`,
    },
    rescheduled: {
      subject: `Interview rescheduled: ${jobTitle} at ${companyName}`,
      eyebrow: "Interview rescheduled",
      heading: `Your ${what} has been rescheduled`,
      intro: `${host} has rescheduled your ${what} for the ${jobTitle} position${jobclubb ? ` at ${companyName}` : ""}. The updated details are below.`,
    },
    reminder: {
      subject: `Reminder: Interview on ${shortDate}, ${time(startsAt)} IST for ${jobTitle} at ${companyName}`,
      eyebrow: "Interview reminder",
      heading: `Your ${what} is coming up`,
      intro: `This is a reminder of your upcoming ${what} with ${host} for the ${jobTitle} position${jobclubb ? ` at ${companyName}` : ""}. The details are below.`,
    },
  }[kind];

  return renderEmail({
    subject: copy.subject,
    preheader: `${jobclubb ? "Screening interview" : `Round ${roundNo}`} on ${shortDate} at ${time(startsAt)} IST.`,
    eyebrow: copy.eyebrow,
    heading: copy.heading,
    greeting: `Dear ${firstName},`,
    paragraphs: jobclubb
      ? [
          copy.intro,
          "JobClubb interviews every candidate before referring them to the employer. Clear this round and we'll share your profile with them.",
        ]
      : [copy.intro],
    details: [
      { label: "Company", value: companyName },
      { label: "Position", value: jobTitle },
      { label: "Round", value: jobclubb ? `JobClubb: ${round}` : `Round ${roundNo}: ${round}` },
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
