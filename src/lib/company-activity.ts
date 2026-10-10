import { STAGES, type InterviewMode } from "@/lib/candidate-activity";

export { STAGES };

// SOP §4.2: companies see skills and experience only. The name is filled in
// once they shortlist; email and phone are never part of this type.
export type Applicant = {
  ref: string;
  jobId: string;
  name: string | null;
  experienceMonths: number;
  city: string;
  skills: string[];
  stage: number;
  status: "active" | "rejected";
  appliedOn: string;
};

export function formatExperienceMonths(months: number) {
  if (months === 0) return "Fresher";
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"}`;
  const years = Math.floor(months / 12);
  return `${years}${months % 12 ? "+" : ""} ${years === 1 ? "year" : "years"}`;
}

export type CompanyInterview = {
  id: string;
  applicantRef: string;
  jobId: string;
  designation: string;
  startsAt: string;
  durationMins: number;
  mode: InterviewMode;
  place: string;
  round: string;
};

export const COMPANY_INTERVIEWS: CompanyInterview[] = [];

export function upcomingCompanyInterviews(now = new Date()) {
  return COMPANY_INTERVIEWS.filter((i) => new Date(i.startsAt) >= now).sort(
    (a, b) => +new Date(a.startsAt) - +new Date(b.startsAt),
  );
}

export function pastCompanyInterviews(now = new Date()) {
  return COMPANY_INTERVIEWS.filter((i) => new Date(i.startsAt) < now).sort(
    (a, b) => +new Date(b.startsAt) - +new Date(a.startsAt),
  );
}
