// TODO: load real applicants and interviews once applications are stored.
// Until then the company dashboard renders empty states for them.

import { STAGES, type InterviewMode } from "@/lib/candidate-activity";

export { STAGES };

// SOP §4.2: companies see skills and experience only, never candidate PII.
export type Applicant = {
  ref: string;
  jobId: string;
  experienceYears: number;
  city: string;
  skills: string[];
  stage: number;
  status: "active" | "rejected";
  appliedOn: string;
};

export const APPLICANTS: Applicant[] = [];

export function applicantsFor(jobId: string) {
  return APPLICANTS.filter((a) => a.jobId === jobId);
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
