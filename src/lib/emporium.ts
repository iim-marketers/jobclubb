import type { FieldErrors } from "@/lib/sign-up-validation";

export const MAX_BATCH_NO = 999;
export const MAX_BATCH_SEATS = 1000;

export type EmporiumBatch = {
  id: string;
  batchNo: number;
  code: string;
  signUpUrl: string;
  seats: number;
  used: number;
  active: boolean;
  createdAt: string;
};

export type EmporiumLocationSummary = {
  id: string;
  name: string;
  batches: number;
  activeBatches: number;
  nextBatchNo: number;
  seats: number;
  used: number;
  latestBatchAt: string | null;
};

export type EmporiumStudent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  membershipExpiresAt: string | null;
  joinedAt: string;
};

export type EmporiumCodeStatus = "ok" | "invalid" | "paused" | "full";

export type EmporiumCodeCheck = {
  status: EmporiumCodeStatus;
  location?: string;
  batchNo?: number;
};

export function emporiumCodeError(check: EmporiumCodeCheck) {
  switch (check.status) {
    case "invalid":
      return "We don't recognise this Emporium code. Check it with your institute.";
    case "paused":
      return "This Emporium code isn't accepting sign-ups right now. Ask your institute.";
    case "full":
      return "Every seat on this Emporium code has been used. Ask your institute for help.";
  }
}

export const batchLabel = (location: string, batchNo: number) =>
  `Emporium ${location} · Batch ${batchNo}`;

const readText = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

function readWholeNumber(value: string) {
  return /^\d{1,4}$/.test(value) ? Number(value) : NaN;
}

export function validateSeats(value: string, min = 1): string | undefined {
  const seats = readWholeNumber(value);
  if (!Number.isInteger(seats) || seats < 1) return "Enter how many students, like 20.";
  if (seats > MAX_BATCH_SEATS) return `A batch can have up to ${MAX_BATCH_SEATS} students.`;
  if (seats < min) return `${min} students have already signed up, so it can't go below ${min}.`;
}

export function validateEmporiumBatch(formData: FormData) {
  const values = {
    location: readText(formData, "location").replace(/\s+/g, " "),
    batchNo: readWholeNumber(readText(formData, "batchNo")),
    seats: readWholeNumber(readText(formData, "seats")),
  };
  const errors: FieldErrors = {};

  if (values.location.length < 2) errors.location = "Enter the centre's location, like Shillong.";
  else if (values.location.length > 80) errors.location = "Use 80 characters or fewer.";
  if (!Number.isInteger(values.batchNo) || values.batchNo < 1 || values.batchNo > MAX_BATCH_NO)
    errors.batchNo = `Enter a batch number from 1 to ${MAX_BATCH_NO}.`;
  const seatsError = validateSeats(readText(formData, "seats"));
  if (seatsError) errors.seats = seatsError;

  return { values, errors };
}
