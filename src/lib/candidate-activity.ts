import type { Venue } from "@/lib/interviews";
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
  // Separate from status, which shows "rejected" even when the job has also closed.
  jobClosed: boolean;
  appliedOn: string;
  stageDates: (string | null)[];
  updatedAgo: string;
  update: string;
  history: { label: string; date: string }[];
};

export function applicationStatus(a: Application) {
  if (a.status === "closed") return "Job closed";
  if (a.status === "rejected") return "Not selected";
  return STAGES[a.stage];
}

export type SavedJob = {
  job: JobListing;
  savedOn: string;
  closesInDays: number;
};

export const SAVED_JOBS: SavedJob[] = [];

export type InterviewMode = "Video call" | "In-person" | "Phone";

export type Interview = {
  id: string;
  company: string;
  companyLogoUrl: string | null;
  role: string;
  applicationId: string;
  startsAt: string;
  endsAt: string;
  durationMins: number;
  mode: InterviewMode;
  place: string;
  venue: Venue | null;
  interviewer: string;
  round: string;
  guaranteed: boolean;
  outcome?: "Cleared" | "Awaiting result" | "Not selected";
};

export const GUARANTEED_INTERVIEWS = 3;

export function upcomingInterviews(interviews: Interview[], now = new Date()) {
  return interviews
    .filter((i) => new Date(i.endsAt) > now)
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
}

export function pastInterviews(interviews: Interview[], now = new Date()) {
  return interviews
    .filter((i) => new Date(i.endsAt) <= now)
    .sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));
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

export function guaranteeSlots(
  interviews: Interview[],
  now = new Date(),
): GuaranteeSlot[] {
  const slots: GuaranteeSlot[] = interviews
    .filter((i) => i.guaranteed)
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
    .map((i) =>
      new Date(i.endsAt) <= now
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
