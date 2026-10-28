import type { InterviewOutcomeLabel, Venue } from "@/lib/interviews";
import type { JobListing } from "@/lib/jobs-data";
import {
  CANDIDATE_OFFER_LABELS,
  isClosed,
  type CandidateOfferStatus,
} from "@/lib/placements";

// 0–1 happen with JobClubb; the employer only sees an application from 2 on.
export const STAGES = [
  "Applied",
  "Screening",
  "Referred",
  "Interview",
  "Offer",
] as const;

export const REFERRED_STAGE = 2;

export type ApplicationStatus = "active" | "closed" | "rejected";

// Only set once JobClubb releases the offer; until then a selected candidate
// sees the same "awaiting result" state as everyone else.
export type CandidateOffer = {
  placementId: string;
  status: CandidateOfferStatus;
  joiningDate: string;
  monthlySalary: number | null;
  notes: string;
};

export type Application = {
  id: string;
  job: JobListing;
  stage: number;
  status: ApplicationStatus;
  offer: CandidateOffer | null;
  // Separate from status, which shows "rejected" even when the job has also closed.
  jobClosed: boolean;
  appliedOn: string;
  stageDates: (string | null)[];
  updatedAgo: string;
  update: string;
  history: { label: string; date: string }[];
};

export function applicationStatus(a: Pick<Application, "status" | "stage" | "offer">) {
  if (a.status === "closed") return "Job closed";
  if (a.status === "rejected") return "Not selected";
  return a.offer ? CANDIDATE_OFFER_LABELS[a.offer.status] : STAGES[a.stage];
}

export const offerEnded = (offer: CandidateOffer | null) =>
  !!offer && isClosed(offer.status) && offer.status !== "joined";

export type SavedJob = {
  job: JobListing;
  savedAt: string;
  postedAt: string;
  closed: boolean;
};

export type InterviewMode = "Video call" | "In-person" | "Phone";

export type InterviewHost = "company" | "jobclubb";

export type Interview = {
  id: string;
  host: InterviewHost;
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
  roundNo: number;
  round: string;
  guaranteed: boolean;
  outcome?: InterviewOutcomeLabel | "Awaiting result";
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
