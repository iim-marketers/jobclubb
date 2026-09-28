// TODO: replace this mock activity with the candidate's real applications,
// saved jobs and interviews once those tables exist.

import { JOBS, type JobListing } from "@/lib/jobs-data";

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

export const APPLICATIONS: Application[] = [
  {
    id: "1042",
    job: JOBS[1],
    stage: 3,
    status: "active",
    appliedOn: "2026-09-26",
    updatedAgo: "1 hour ago",
    update: "Interview scheduled for Thu, 1 Oct at 11:00 AM over video call.",
    history: [
      { label: "Applied", date: "26 Sep" },
      { label: "Viewed by Taj HR", date: "26 Sep" },
      { label: "Shortlisted", date: "27 Sep" },
      { label: "Interview scheduled", date: "28 Sep" },
    ],
  },
  {
    id: "1043",
    job: JOBS[0],
    stage: 1,
    status: "active",
    appliedOn: "2026-09-24",
    updatedAgo: "5 hours ago",
    update: "IndiGo's recruiter viewed your application and resume.",
    history: [
      { label: "Applied", date: "24 Sep" },
      { label: "Viewed by IndiGo", date: "28 Sep" },
    ],
  },
  {
    id: "1044",
    job: JOBS[2],
    stage: 2,
    status: "active",
    appliedOn: "2026-09-21",
    updatedAgo: "2 days ago",
    update: "You're on the shortlist. Air India usually replies within 5 days.",
    history: [
      { label: "Applied", date: "21 Sep" },
      { label: "Viewed by Air India", date: "22 Sep" },
      { label: "Shortlisted", date: "26 Sep" },
    ],
  },
  {
    id: "1045",
    job: JOBS[10],
    stage: 0,
    status: "active",
    appliedOn: "2026-09-27",
    updatedAgo: "1 day ago",
    update: "Delivered to Emirates. Most employers open new applications within 3 days.",
    history: [{ label: "Applied", date: "27 Sep" }],
  },
  {
    id: "1046",
    job: JOBS[3],
    stage: 1,
    status: "rejected",
    appliedOn: "2026-09-10",
    updatedAgo: "1 week ago",
    update: "J.W. Marriott went ahead with candidates who have fine-dining experience.",
    history: [
      { label: "Applied", date: "10 Sep" },
      { label: "Viewed by J.W. Marriott", date: "12 Sep" },
      { label: "Not selected", date: "20 Sep" },
    ],
  },
  {
    id: "1047",
    job: JOBS[4],
    stage: 0,
    status: "closed",
    appliedOn: "2026-09-05",
    updatedAgo: "3 weeks ago",
    update: "MakeMyTrip closed this opening before reviewing new applications.",
    history: [
      { label: "Applied", date: "5 Sep" },
      { label: "Job closed", date: "8 Sep" },
    ],
  },
];

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

export const SAVED_JOBS: SavedJob[] = [
  { job: JOBS[5], savedOn: "2026-09-27", closesInDays: 2 },
  { job: JOBS[11], savedOn: "2026-09-26", closesInDays: 12 },
  { job: JOBS[6], savedOn: "2026-09-25", closesInDays: 4 },
  { job: JOBS[9], savedOn: "2026-09-22", closesInDays: 18 },
  { job: JOBS[8], savedOn: "2026-09-20", closesInDays: 9 },
  { job: JOBS[7], savedOn: "2026-09-18", closesInDays: 21 },
  { job: JOBS[1], savedOn: "2026-09-16", closesInDays: 6 },
];

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

export const INTERVIEWS: Interview[] = [
  {
    id: "int-1",
    company: "Taj",
    role: "Front Office Executive",
    jobSlug: JOBS[1].slug,
    startsAt: "2026-10-01T11:00:00+05:30",
    durationMins: 30,
    mode: "Video call",
    place: "Google Meet — link shared 1 hour before",
    interviewer: "Priya Nair, Talent Acquisition",
    round: "HR round",
    guaranteed: true,
  },
  {
    id: "int-2",
    company: "Air India",
    role: "Airport Ground Services Executive",
    jobSlug: JOBS[2].slug,
    startsAt: "2026-10-06T15:30:00+05:30",
    durationMins: 45,
    mode: "In person",
    place: "Kempegowda International Airport, Terminal 2 admin block",
    interviewer: "Ground operations panel",
    round: "Panel round",
    guaranteed: false,
  },
  {
    id: "int-3",
    company: "IndiGo",
    role: "Cabin Crew Member",
    jobSlug: JOBS[0].slug,
    startsAt: "2026-09-12T10:00:00+05:30",
    durationMins: 40,
    mode: "In person",
    place: "IndiGo Training Centre, Kolkata",
    interviewer: "Cabin services panel",
    round: "Grooming & group discussion",
    guaranteed: true,
    outcome: "Awaiting result",
  },
];

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
