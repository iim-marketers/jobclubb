export type ScreeningState =
  | "new"
  | "interview"
  | "shortlisted"
  | "referred"
  | "not_selected"
  | "closed";

export const SCREENING_LABELS: Record<ScreeningState, string> = {
  new: "To screen",
  interview: "JobClubb interview",
  shortlisted: "Ready to refer",
  referred: "With employer",
  not_selected: "Not selected",
  closed: "Job closed",
};

export const SCREENING_BADGES: Record<ScreeningState, string> = {
  new: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  interview: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  shortlisted: "bg-brand/10 text-brand",
  referred: "bg-good/12 text-good",
  not_selected: "bg-destructive/10 text-destructive",
  closed: "bg-slate-500/12 text-slate-600 dark:text-slate-300",
};

export type ScreeningApplication = {
  ref: string;
  candidateName: string;
  candidatePhone: string;
  city: string;
  experienceMonths: number;
  designation: string;
  companyName: string;
  state: ScreeningState;
  rejectedBy: "jobclubb" | "employer" | null;
  appliedOn: string;
  interviewAt: string | null;
};
