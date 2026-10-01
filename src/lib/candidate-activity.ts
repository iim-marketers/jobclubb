// TODO: load the candidate's real applications, saved jobs and interviews
// once those tables exist. Until then the dashboard renders empty states.

import type { JobListing } from "@/lib/jobs-data";

export const STAGES = [
  "Applied",
  "Viewed",
  "Shortlisted",
  "Interview",
  "Offer",
] as const;

export type ApplicationStatus = "active" | "closed" | "rejected";

export type Application = {
  id: string;
  job: JobListing;
  stage: number;
  status: ApplicationStatus;
  appliedOn: string;
  updatedAgo: string;
  update: string;
  history: { label: string; date: string }[];
};

export const APPLICATIONS: Application[] = [];

export function getApplication(id: string) {
  return APPLICATIONS.find((a) => a.id === id);
}

export function applicationStatus(a: Application) {
  if (a.status === "closed") return "Job closed";
  if (a.status === "rejected") return "Not selected";
  return STAGES[a.stage];
}

export function applicationFor(jobSlug: string) {
  return APPLICATIONS.find((a) => a.job.slug === jobSlug);
}

export function interviewsFor(jobSlug: string) {
  return INTERVIEWS.filter((i) => i.jobSlug === jobSlug);
}

export type SavedJob = {
  job: JobListing;
  savedOn: string;
  closesInDays: number;
};

export const SAVED_JOBS: SavedJob[] = [];

export type InterviewMode = "Video call" | "In person" | "Phone";

export type Interview = {
  id: string;
  company: string;
  role: string;
  jobSlug: string;
  startsAt: string;
  durationMins: number;
  mode: InterviewMode;
  place: string;
  interviewer: string;
  round: string;
  guaranteed: boolean;
  outcome?: "Cleared" | "Awaiting result" | "Not selected";
};

export const INTERVIEWS: Interview[] = [];

export const GUARANTEED_INTERVIEWS = 3;

export function upcomingInterviews(now = new Date()) {
  return INTERVIEWS.filter((i) => new Date(i.startsAt) >= now).sort(
    (a, b) => +new Date(a.startsAt) - +new Date(b.startsAt),
  );
}

export function pastInterviews(now = new Date()) {
  return INTERVIEWS.filter((i) => new Date(i.startsAt) < now).sort(
    (a, b) => +new Date(b.startsAt) - +new Date(a.startsAt),
  );
}

const IST = "Asia/Kolkata";

export function formatInterviewDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: IST,
  }).format(new Date(iso));
}

export function formatInterviewTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: IST,
  }).format(new Date(iso));
}

export function formatShortDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: IST,
  }).format(new Date(isoDate));
}

export type GuaranteeSlot = {
  company: string | null;
  state: "done" | "scheduled" | "open";
  note: string;
};

export function guaranteeSlots(now = new Date()): GuaranteeSlot[] {
  const slots: GuaranteeSlot[] = INTERVIEWS.filter((i) => i.guaranteed)
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
    .map((i) =>
      new Date(i.startsAt) < now
        ? {
            company: i.company,
            state: "done",
            note: `Completed ${formatShortDate(i.startsAt)}`,
          }
        : {
            company: i.company,
            state: "scheduled",
            note: formatInterviewDate(i.startsAt),
          },
    );
  while (slots.length < GUARANTEED_INTERVIEWS)
    slots.push({ company: null, state: "open", note: "Still yours to use" });
  return slots;
}
