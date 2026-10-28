export const PLACEMENT_STATUSES = [
  "awaiting_offer",
  "offer_received",
  "released",
  "accepted",
  "joined",
  "not_joined",
  "expired",
  "declined",
  "withdrawn",
] as const;

export type PlacementStatus = (typeof PLACEMENT_STATUSES)[number];

export const PLACEMENT_EMAIL = "placement@jobclubb.com";

export const isFresher = (candidate: { emporium_batch_id: string | null }) =>
  candidate.emporium_batch_id !== null;

export const candidateCategory = (fresher: boolean) => (fresher ? "Fresher" : "Experienced");

export const placementFeeNote = (fresher: boolean) =>
  fresher
    ? "As an Emporium candidate, you pay JobClubb a placement fee equal to one month's salary if you're placed. It isn't paid on JobClubb.com: our placement team arranges it with you before sending your offer letter."
    : "No placement fee: as a paid member, you never pay JobClubb any part of your salary.";

// Before the release the candidate must not learn they were selected.
export const isReleased = (status: PlacementStatus) =>
  status !== "awaiting_offer" && status !== "offer_received";

export const isClosed = (status: PlacementStatus) =>
  status === "joined" ||
  status === "not_joined" ||
  status === "expired" ||
  status === "declined" ||
  status === "withdrawn";

export const COMPANY_PLACEMENT_LABELS: Record<PlacementStatus, string> = {
  awaiting_offer: "Upload offer letter",
  offer_received: "Offer received",
  released: "With candidate",
  accepted: "Candidate confirmed",
  joined: "Joined",
  not_joined: "Did not join",
  expired: "Expired",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

export const ADMIN_PLACEMENT_LABELS: Record<PlacementStatus, string> = {
  awaiting_offer: "Awaiting offer",
  offer_received: "Ready to send",
  released: "With candidate",
  accepted: "Offer sent",
  joined: "Joined",
  not_joined: "Did not join",
  expired: "Expired",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

export type CandidateOfferStatus = Exclude<PlacementStatus, "awaiting_offer" | "offer_received">;

export const CANDIDATE_OFFER_LABELS: Record<CandidateOfferStatus, string> = {
  released: "Selected",
  accepted: "Offer accepted",
  joined: "Hired",
  not_joined: "Did not join",
  expired: "Offer expired",
  declined: "Offer declined",
  withdrawn: "Offer withdrawn",
};

const PLACEMENT_BADGES: Record<PlacementStatus, string> = {
  awaiting_offer: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  offer_received: "bg-brand/10 text-brand",
  released: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  accepted: "bg-good/12 text-good",
  joined: "bg-good text-white",
  not_joined: "bg-orange-500/12 text-orange-700 dark:text-orange-300",
  expired: "bg-slate-500/12 text-slate-600 dark:text-slate-300",
  declined: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  withdrawn: "bg-destructive/10 text-destructive",
};

export const placementBadge = (status: PlacementStatus) => PLACEMENT_BADGES[status];

export function candidateOfferBadge(status: CandidateOfferStatus) {
  return status === "released" || status === "accepted" || status === "joined"
    ? "bg-good/12 text-good"
    : "bg-muted text-muted-foreground";
}

const IST = "Asia/Kolkata";

export function todayIst(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(now);
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addMonths(date: string, months: number) {
  const [y, m, d] = date.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

// A date in IST lasts until the following midnight.
export const deadlineEnd = (date: string) => new Date(`${addDays(date, 1)}T00:00:00+05:30`);

export function formatDateOnly(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 ? 2 : 0,
  }).format(paise / 100);
}

export function parseRupees(raw: string) {
  const value = raw.replace(/[,\s₹]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const paise = Math.round(Number(value) * 100);
  return paise >= 100 && paise <= 100000000 ? paise : null;
}

export const OFFER_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
// Server actions accept 6 MB (next.config.ts), so one upload carries up to 5 MB.
export const MAX_OFFER_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_OFFER_FILES = 5;

export type OfferTerms = {
  monthlySalary: number;
  joiningDate: string;
  offerDeadline: string | null;
  notes: string;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateOfferTerms(
  formData: FormData,
  now = new Date(),
): { values: OfferTerms; errors: Partial<Record<keyof OfferTerms, string>> } {
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const salary = parseRupees(text("monthlySalary"));
  const values: OfferTerms = {
    monthlySalary: salary ?? 0,
    joiningDate: text("joiningDate"),
    offerDeadline: text("offerDeadline") || null,
    notes: text("notes"),
  };
  const errors: Partial<Record<keyof OfferTerms, string>> = {};
  const today = todayIst(now);

  if (salary === null)
    errors.monthlySalary = "Enter the fixed monthly gross salary in rupees, like 25000.";
  if (!DATE.test(values.joiningDate)) errors.joiningDate = "Choose the joining date.";
  else if (values.joiningDate < today) errors.joiningDate = "Choose a date from today onwards.";
  if (values.offerDeadline) {
    if (!DATE.test(values.offerDeadline)) errors.offerDeadline = "Choose a valid date.";
    else if (values.offerDeadline < today)
      errors.offerDeadline = "Choose a date from today onwards.";
    else if (!errors.joiningDate && values.offerDeadline > values.joiningDate)
      errors.offerDeadline = "The candidate must accept on or before the joining date.";
  }
  if (values.notes.length > 2000) errors.notes = "Use 2,000 characters or fewer.";

  return { values, errors };
}

// What the employer must report after joining, under the employer agreement.
export const LEFT_REASONS = {
  resigned: "Resigned",
  terminated: "Terminated",
  ended: "Employment ended",
} as const;

export type LeftReason = keyof typeof LEFT_REASONS;

export type Leaving = {
  leftOn: string;
  reason: LeftReason;
  resignedOn: string | null;
  notes: string;
};

export const REPLACEMENT_MONTHS = 3;

export type ReplacementStatus = "owed" | "fulfilled" | "waived";

export const replacementWindowEnd = (joiningDate: string) =>
  addDays(addMonths(joiningDate, REPLACEMENT_MONTHS), -1);

export const COMPANY_REPLACEMENT_LABELS: Record<ReplacementStatus, string> = {
  owed: "Replacement on the way",
  fulfilled: "Replacement referred",
  waived: "Closed without replacement",
};

export const qualifiesForReplacement = (joiningDate: string, resignedOn: string) =>
  resignedOn <= replacementWindowEnd(joiningDate);

export function validateLeaving(
  formData: FormData,
  joiningDate: string,
  now = new Date(),
): { values: Leaving; errors: Partial<Record<keyof Leaving, string>> } {
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const reason = text("reason") as LeftReason;
  const values: Leaving = {
    leftOn: text("leftOn"),
    reason,
    resignedOn: reason === "resigned" ? text("resignedOn") : null,
    notes: text("notes"),
  };
  const errors: Partial<Record<keyof Leaving, string>> = {};
  const today = todayIst(now);
  if (!DATE.test(values.leftOn)) errors.leftOn = "Choose their last working day.";
  else if (values.leftOn < joiningDate) errors.leftOn = "Choose a date on or after they joined.";
  else if (values.leftOn > today) errors.leftOn = "Choose a date up to today.";
  if (!(values.reason in LEFT_REASONS)) errors.reason = "Choose what happened.";
  if (values.resignedOn !== null) {
    if (!DATE.test(values.resignedOn)) errors.resignedOn = "Choose the date they resigned.";
    else if (values.resignedOn < joiningDate)
      errors.resignedOn = "Choose a date on or after they joined.";
    else if (values.resignedOn > today) errors.resignedOn = "Choose a date up to today.";
    else if (!errors.leftOn && values.resignedOn > values.leftOn)
      errors.resignedOn = "They must have resigned on or before their last working day.";
  }
  if (values.notes.length > 1000) errors.notes = "Use 1,000 characters or fewer.";
  return { values, errors };
}
