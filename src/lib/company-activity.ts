import { STAGES, type InterviewMode } from "@/lib/candidate-activity";
import type { InterviewOutcomeLabel, Venue } from "@/lib/interviews";

export { STAGES };

// SOP §4.2: companies see skills and experience only. The name is filled in
// once they shortlist; email and phone are never part of this type.
export type Applicant = {
  ref: string;
  jobId: string;
  label: string;
  name: string | null;
  experienceMonths: number;
  city: string;
  skills: string[];
  stage: number;
  status: "active" | "rejected";
  selected: boolean;
  appliedOn: string;
};

export const candidateLabel = (no: number) => `CAND-${String(no).padStart(4, "0")}`;

export function formatExperienceMonths(months: number) {
  if (months === 0) return "Fresher";
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"}`;
  const years = Math.floor(months / 12);
  return `${years}${months % 12 ? "+" : ""} ${years === 1 ? "year" : "years"}`;
}

export type CompanyInterview = {
  id: string;
  applicantRef: string;
  applicant: string;
  jobId: string;
  designation: string;
  startsAt: string;
  endsAt: string;
  durationMins: number;
  mode: InterviewMode;
  place: string;
  venue: Venue | null;
  interviewer: string;
  roundNo: number;
  round: string;
  outcome: InterviewOutcomeLabel | null;
};

export function upcomingCompanyInterviews(interviews: CompanyInterview[], now = new Date()) {
  return interviews.filter((i) => new Date(i.endsAt) > now).sort(
    (a, b) => +new Date(a.startsAt) - +new Date(b.startsAt),
  );
}

export function pastCompanyInterviews(interviews: CompanyInterview[], now = new Date()) {
  return interviews.filter((i) => new Date(i.endsAt) <= now).sort(
    (a, b) => +new Date(b.startsAt) - +new Date(a.startsAt),
  );
}
