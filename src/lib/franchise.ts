import { locationPrefix } from "@/lib/emporium";
import { pincodeState } from "@/lib/gst";
import { addDays, parseRupees, todayIst } from "@/lib/placements";
import { GSTIN_PATTERN, type FieldErrors, type SignUpStep } from "@/lib/sign-up-validation";
import { INDUSTRIES } from "@/lib/taxonomy";

export const FRANCHISE_HOME = "/franchise/dashboard";
export const FRANCHISE_CANDIDATES = `${FRANCHISE_HOME}/candidates`;
export const FRANCHISE_REGISTER = `${FRANCHISE_CANDIDATES}/new`;
export const FRANCHISE_EARNINGS = `${FRANCHISE_HOME}/earnings`;
export const FRANCHISE_SETTINGS = `${FRANCHISE_HOME}/settings`;

export const FRANCHISE_SIGN_OUT_DESCRIPTION =
  "You'll need to sign in again to register candidates and see your commission.";

export const FRANCHISE_CODE_PREFIX = "JC-FR-";
export const FRANCHISE_SOURCE = "Franchise";
export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 15;
export const OTP_MAX_ATTEMPTS = 5;
export const PAYOUT_WORKING_DAYS = 2;
export const STATEMENT_DISPUTE_DAYS = 15;
// Clause 3.1: the same one-time fee for every franchise, plus GST.
export const FRANCHISE_FEE = 300_000_00;
export const FRANCHISE_FEE_LABEL = "₹3,00,000 + GST";
// Clause 4.1; larger outlets need JobClubb's written approval, so only the minimum is enforced.
export const MIN_AREA_SQFT = 200;
const MAX_AREA_SQFT = 100000;

export const CONSTITUTIONS = [
  { value: "individual", label: "Individual" },
  { value: "proprietorship", label: "Proprietorship" },
  { value: "partnership", label: "Partnership firm" },
  { value: "llp", label: "LLP" },
  { value: "company", label: "Company" },
] as const;

export type Constitution = (typeof CONSTITUTIONS)[number]["value"];

export const constitutionLabel = (value: string | null) =>
  CONSTITUTIONS.find((c) => c.value === value)?.label ?? "—";

export const franchiseCodeFor = (city: string, n: number) =>
  `${FRANCHISE_CODE_PREFIX}${locationPrefix(city)}${String(n).padStart(3, "0")}`;

export type FranchiseStatus = "upcoming" | "active" | "expired" | "terminated";

export type FranchiseTerm = {
  startsOn: string;
  endsOn: string;
  terminatedOn: string | null;
};

export const lastDayOf = (term: FranchiseTerm) =>
  term.terminatedOn && term.terminatedOn < term.endsOn ? term.terminatedOn : term.endsOn;

export function franchiseStatus(term: FranchiseTerm, today = todayIst()): FranchiseStatus {
  if (today < term.startsOn) return "upcoming";
  if (today <= lastDayOf(term)) return "active";
  return term.terminatedOn && term.terminatedOn <= term.endsOn ? "terminated" : "expired";
}

export const FRANCHISE_STATUS_LABELS: Record<FranchiseStatus, string> = {
  upcoming: "Starts soon",
  active: "Active",
  expired: "Expired",
  terminated: "Terminated",
};

export const FRANCHISE_STATUS_BADGES: Record<FranchiseStatus, string> = {
  upcoming: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  active: "bg-good/12 text-good",
  expired: "bg-muted text-muted-foreground",
  terminated: "bg-destructive/10 text-destructive",
};

export const defaultEndsOn = (startsOn: string) => {
  const [y, m, d] = startsOn.split("-").map(Number);
  const next = new Date(Date.UTC(y + 1, m - 1, d));
  if (next.getUTCMonth() !== m - 1) next.setUTCDate(0);
  return addDays(next.toISOString().slice(0, 10), -1);
};

export const daysBetween = (from: string, to: string) =>
  Math.round(
    (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) /
      86_400_000,
  );

// Clause 9.4: payable within two working days of the candidate's payment.
export function payoutDueOn(earnedAt: string) {
  let date = todayIst(new Date(earnedAt));
  let left = PAYOUT_WORKING_DAYS;
  while (left > 0) {
    date = addDays(date, 1);
    const day = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  return date;
}

export type CommissionKind = "registration" | "placement" | "reversal";

export const COMMISSION_KIND_LABELS: Record<CommissionKind, string> = {
  registration: "Registration fee",
  placement: "Placement fee",
  reversal: "Reversal",
};

export type CommissionState = "outstanding" | "paid" | "cancelled" | "reversed";

export const COMMISSION_STATE_LABELS: Record<CommissionState, string> = {
  outstanding: "Outstanding",
  paid: "Paid",
  cancelled: "Cancelled",
  reversed: "Reversed",
};

export const COMMISSION_STATE_BADGES: Record<CommissionState, string> = {
  outstanding: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  paid: "bg-good/12 text-good",
  cancelled: "bg-muted text-muted-foreground",
  reversed: "bg-destructive/10 text-destructive",
};

export function commissionState(row: {
  payoutId: string | null;
  reversedAt: string | null;
}): CommissionState {
  if (row.reversedAt) return row.payoutId ? "reversed" : "cancelled";
  return row.payoutId ? "paid" : "outstanding";
}

export const monthKey = (iso: string) => todayIst(new Date(iso)).slice(0, 7);

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^(\+?91[\s-]?)?[6-9]\d{4}\s?\d{5}$/;
const PINCODE_PATTERN = /^\d{6}$/;
const PAN_PATTERN = /^[A-Z]{5}\d{4}[A-Z]$/;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_PATTERN = /^\d{6,18}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const oneLine = (value: string) => value.replace(/\s+/g, " ");

function isRealDate(value: string) {
  if (!DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function lengthError(value: string, max: number) {
  return value.length > max ? `Use ${max} characters or fewer.` : undefined;
}

function passwordError(password: string) {
  if (password.length < 8) return "Use at least 8 characters.";
  if (new TextEncoder().encode(password).length > 72) return "Use 72 characters or fewer.";
}

function cleanErrors(errors: FieldErrors) {
  for (const key of Object.keys(errors)) if (!errors[key]) delete errors[key];
  return errors;
}

// Business, outlet and bank details: what the franchisee gives at sign-up.
export function validateFranchiseProfile(formData: FormData) {
  const values = {
    name: oneLine(text(formData, "name")),
    legalName: oneLine(text(formData, "legalName")),
    constitution: text(formData, "constitution"),
    pan: text(formData, "pan").toUpperCase(),
    gstin: text(formData, "gstin").toUpperCase(),
    ownerName: oneLine(text(formData, "ownerName")),
    phone: text(formData, "phone"),
    registeredAddress: text(formData, "registeredAddress"),
    outletAddress: text(formData, "outletAddress"),
    city: oneLine(text(formData, "city")),
    pincode: text(formData, "pincode"),
    areaSqft: text(formData, "areaSqft"),
    bankAccountName: oneLine(text(formData, "bankAccountName")),
    bankName: oneLine(text(formData, "bankName")),
    bankAccountNo: text(formData, "bankAccountNo").replace(/\s/g, ""),
    bankIfsc: text(formData, "bankIfsc").toUpperCase(),
  };
  const errors: FieldErrors = {};

  if (values.name.length < 2) errors.name = "Enter a name for the outlet, like Sharma Placements, Salt Lake.";
  else errors.name = lengthError(values.name, 80);
  if (values.legalName.length < 2) errors.legalName = "Enter the full legal name of the person or business.";
  else errors.legalName = lengthError(values.legalName, 120);
  if (!CONSTITUTIONS.some((c) => c.value === values.constitution))
    errors.constitution = "Choose how the business is set up.";
  if (!PAN_PATTERN.test(values.pan)) errors.pan = "PAN should be 10 characters, like ABCDE1234F.";
  if (values.gstin && !GSTIN_PATTERN.test(values.gstin))
    errors.gstin = "GSTIN should be 15 characters, like 19AABCT1234F1Z5.";
  if (!values.ownerName) errors.ownerName = "Enter the name of the person who represents the business.";
  else errors.ownerName = lengthError(values.ownerName, 80);
  if (!PHONE_PATTERN.test(values.phone)) errors.phone = "Enter a valid 10-digit Indian mobile number.";
  if (values.registeredAddress.length < 10) errors.registeredAddress = "Enter the full registered or residential address.";
  else errors.registeredAddress = lengthError(values.registeredAddress, 300);
  if (values.outletAddress.length < 10) errors.outletAddress = "Enter the full address of the outlet.";
  else errors.outletAddress = lengthError(values.outletAddress, 300);
  if (!values.city) errors.city = "Enter the outlet's city.";
  else errors.city = lengthError(values.city, 80);
  if (!PINCODE_PATTERN.test(values.pincode)) errors.pincode = "Enter a 6-digit pincode.";
  else if (!pincodeState(values.pincode)) errors.pincode = "Enter a valid Indian pincode.";

  const areaSqft = /^\d{1,6}$/.test(values.areaSqft) ? Number(values.areaSqft) : NaN;
  if (!values.areaSqft) errors.areaSqft = "Enter the outlet's area in square feet.";
  else if (!Number.isInteger(areaSqft) || areaSqft > MAX_AREA_SQFT)
    errors.areaSqft = "Enter the area in whole square feet, like 300.";
  else if (areaSqft < MIN_AREA_SQFT)
    errors.areaSqft = `A franchise outlet must be at least ${MIN_AREA_SQFT} sq ft.`;

  const bankGiven = [values.bankAccountName, values.bankName, values.bankAccountNo, values.bankIfsc].some(Boolean);
  if (bankGiven) {
    if (!values.bankAccountName) errors.bankAccountName = "Enter the name on the account.";
    else errors.bankAccountName = lengthError(values.bankAccountName, 120);
    if (!values.bankName) errors.bankName = "Enter the bank and branch.";
    else errors.bankName = lengthError(values.bankName, 120);
    if (!ACCOUNT_PATTERN.test(values.bankAccountNo)) errors.bankAccountNo = "Enter the account number, 6 to 18 digits.";
    if (!IFSC_PATTERN.test(values.bankIfsc)) errors.bankIfsc = "IFSC should be 11 characters, like SBIN0001234.";
  }

  return {
    values: {
      ...values,
      areaSqft,
      gstin: values.gstin || null,
      bankAccountName: values.bankAccountName || null,
      bankName: values.bankName || null,
      bankAccountNo: values.bankAccountNo || null,
      bankIfsc: values.bankIfsc || null,
    },
    errors: cleanErrors(errors),
  };
}

export type FranchiseProfileInput = ReturnType<typeof validateFranchiseProfile>["values"];

// Schedule A terms that only admin sets, when approving or creating a franchise.
export function validateFranchiseTerms(formData: FormData) {
  const values = {
    territory: text(formData, "territory"),
    exclusive: text(formData, "exclusive") === "yes",
    feePaidOn: text(formData, "feePaidOn"),
    feePaymentMode: oneLine(text(formData, "feePaymentMode")),
    feeTransactionId: text(formData, "feeTransactionId").replace(/\s+/g, ""),
    startsOn: text(formData, "startsOn"),
    endsOn: text(formData, "endsOn"),
  };
  const errors: FieldErrors = {};

  if (values.territory.length < 2) errors.territory = "Describe the territory, like the PIN codes or wards it covers.";
  else errors.territory = lengthError(values.territory, 500);

  if (!values.feePaidOn) errors.feePaidOn = "Choose the date the franchise fee was received.";
  else if (!isRealDate(values.feePaidOn)) errors.feePaidOn = "Choose a valid date.";
  else if (values.feePaidOn > todayIst()) errors.feePaidOn = "Choose a date up to today.";
  if (values.feePaymentMode.length < 2) errors.feePaymentMode = "Enter how the fee was paid, like NEFT or UPI.";
  else errors.feePaymentMode = lengthError(values.feePaymentMode, 120);
  if (values.feeTransactionId.length < 3)
    errors.feeTransactionId = "Enter the transaction ID or UTR number of the fee payment.";
  else errors.feeTransactionId = lengthError(values.feeTransactionId, 60);

  if (!isRealDate(values.startsOn)) errors.startsOn = "Choose the date the agreement starts.";
  const endsOn = values.endsOn || (isRealDate(values.startsOn) ? defaultEndsOn(values.startsOn) : "");
  if (values.endsOn && !isRealDate(values.endsOn)) errors.endsOn = "Choose a valid date.";
  else if (isRealDate(values.startsOn) && endsOn <= values.startsOn)
    errors.endsOn = "Choose a date after the start date.";

  return {
    values: {
      ...values,
      franchiseFee: FRANCHISE_FEE,
      endsOn,
      feePaidOn: values.feePaidOn,
      feePaymentMode: values.feePaymentMode,
      feeTransactionId: values.feeTransactionId,
    },
    errors: cleanErrors(errors),
  };
}

export type FranchiseTermsInput = ReturnType<typeof validateFranchiseTerms>["values"];

export function validateFranchiseLogin(formData: FormData, { confirm }: { confirm: boolean }) {
  const values = {
    email: text(formData, "email").toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
  const errors: FieldErrors = {};
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "Enter a valid email address.";
  else if (values.email.length > 254) errors.email = "Use 254 characters or fewer.";
  errors.password = passwordError(values.password);
  if (confirm && !errors.password && values.password !== String(formData.get("confirmPassword") ?? ""))
    errors.confirmPassword = "Passwords don't match.";
  return { values, errors: cleanErrors(errors) };
}

export function validateFranchiseDetails(formData: FormData, { creating }: { creating: boolean }) {
  const profile = validateFranchiseProfile(formData);
  const terms = validateFranchiseTerms(formData);
  const login = creating ? validateFranchiseLogin(formData, { confirm: false }) : null;
  return {
    values: { ...profile.values, ...terms.values, ...(login?.values ?? { email: "", password: "" }) },
    errors: { ...profile.errors, ...terms.errors, ...(login?.errors ?? {}) },
  };
}

export type FranchiseInput = ReturnType<typeof validateFranchiseDetails>["values"];

export const FRANCHISE_SIGN_UP_STEPS: SignUpStep[] = [
  {
    title: "Business",
    description: "The person or business that will sign the franchise agreement.",
    fields: ["legalName", "constitution", "pan", "gstin", "registeredAddress"],
  },
  {
    title: "Outlet",
    description: "Where you'll meet candidates. JobClubb confirms your territory when it approves you.",
    fields: ["name", "outletAddress", "city", "pincode", "areaSqft"],
  },
  {
    title: "Payouts",
    description: "Where JobClubb sends your commission. You can leave this for now and add it before your first payout.",
    fields: ["bankAccountName", "bankName", "bankAccountNo", "bankIfsc"],
  },
  {
    title: "Your login",
    description: "Who runs the franchise, and the email and password for your dashboard.",
    fields: ["ownerName", "phone", "email", "password", "confirmPassword", "acceptTerms"],
  },
];

export function validateFranchiseSignUp(formData: FormData): FieldErrors {
  const errors = {
    ...validateFranchiseProfile(formData).errors,
    ...validateFranchiseLogin(formData, { confirm: true }).errors,
  };
  if (text(formData, "acceptTerms") !== "yes")
    errors.acceptTerms = "Confirm your details and accept the Terms & Conditions and Privacy Policy.";
  return errors;
}

export function validateTermination(formData: FormData, term: FranchiseTerm) {
  const values = { terminatedOn: text(formData, "terminatedOn"), note: text(formData, "note") };
  const errors: FieldErrors = {};
  if (!isRealDate(values.terminatedOn)) errors.terminatedOn = "Choose the last day the agreement is in force.";
  else if (values.terminatedOn < term.startsOn) errors.terminatedOn = "Choose a date on or after the agreement started.";
  else if (values.terminatedOn > term.endsOn) errors.terminatedOn = "Choose a date on or before the agreement ends.";
  if (values.note.length < 3) errors.note = "Say why, for the record.";
  else if (values.note.length > 500) errors.note = "Use 500 characters or fewer.";
  return { values, errors };
}

export function validateExtension(formData: FormData, term: FranchiseTerm) {
  const endsOn = text(formData, "endsOn");
  const errors: FieldErrors = {};
  if (!isRealDate(endsOn)) errors.endsOn = "Choose the new end date.";
  else if (endsOn <= term.startsOn) errors.endsOn = "Choose a date after the agreement started.";
  else if (endsOn < todayIst()) errors.endsOn = "Choose today or a later date.";
  // Reinstating a terminated franchise may keep its original end date.
  else if (!term.terminatedOn && endsOn <= term.endsOn)
    errors.endsOn = "Choose a date later than the current end date.";
  return { endsOn, errors };
}

export const FRANCHISE_CANDIDATE_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "city",
  "pincode",
  "industry",
  "consent",
] as const;

export function validateFranchiseCandidate(formData: FormData) {
  const values = {
    firstName: oneLine(text(formData, "firstName")),
    lastName: oneLine(text(formData, "lastName")),
    email: text(formData, "email").toLowerCase(),
    phone: text(formData, "phone"),
    city: oneLine(text(formData, "city")),
    pincode: text(formData, "pincode"),
    industry: text(formData, "industry"),
    consent: text(formData, "consent") === "yes",
  };
  const errors: FieldErrors = {};

  if (!values.firstName) errors.firstName = "Enter the candidate's first name.";
  else if (values.firstName.length > 80) errors.firstName = "Use 80 characters or fewer.";
  if (!values.lastName) errors.lastName = "Enter the candidate's last name.";
  else if (values.lastName.length > 80) errors.lastName = "Use 80 characters or fewer.";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "Enter the candidate's email address.";
  else if (values.email.length > 254) errors.email = "Use 254 characters or fewer.";
  if (!PHONE_PATTERN.test(values.phone)) errors.phone = "Enter a valid 10-digit Indian mobile number.";
  if (!values.city) errors.city = "Enter the candidate's city.";
  else if (values.city.length > 80) errors.city = "Use 80 characters or fewer.";
  if (!PINCODE_PATTERN.test(values.pincode)) errors.pincode = "Enter a 6-digit pincode.";
  if (!INDUSTRIES.some((s) => s.slug === values.industry)) errors.industry = "Choose an industry.";
  if (!values.consent) errors.consent = "Confirm the candidate has agreed to share these details.";

  return { values, errors };
}

export type FranchiseCandidateInput = ReturnType<typeof validateFranchiseCandidate>["values"];

export function validateOtp(formData: FormData) {
  const code = text(formData, "code").replace(/\s/g, "");
  if (!code) return { code, error: "Enter the 6-digit code from the candidate's email." };
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code)) return { code, error: "The code is 6 digits." };
  return { code, error: undefined };
}

export function validateCandidateFee(formData: FormData, selectedOn: string) {
  const values = {
    amount: parseRupees(text(formData, "amount")),
    receivedOn: text(formData, "receivedOn"),
    reference: oneLine(text(formData, "reference")),
  };
  const errors: FieldErrors = {};
  if (values.amount === null) errors.amount = "Enter the amount received in rupees, like 25000.";
  if (!isRealDate(values.receivedOn)) errors.receivedOn = "Choose the date it was received.";
  else if (values.receivedOn > todayIst()) errors.receivedOn = "Choose a date up to today.";
  else if (values.receivedOn < selectedOn) errors.receivedOn = "Choose a date on or after the candidate was selected.";
  if (values.reference.length > 120) errors.reference = "Use 120 characters or fewer.";
  return { values, errors };
}

export function validatePayout(formData: FormData) {
  const values = {
    expected: Number(text(formData, "expected")),
    paidOn: text(formData, "paidOn"),
    reference: oneLine(text(formData, "reference")),
    note: text(formData, "note"),
  };
  const errors: FieldErrors = {};
  if (!isRealDate(values.paidOn)) errors.paidOn = "Choose the date of the transfer.";
  else if (values.paidOn > todayIst()) errors.paidOn = "Choose a date up to today.";
  if (values.reference.length < 3) errors.reference = "Enter the UTR or transaction reference.";
  else if (values.reference.length > 60) errors.reference = "Use 60 characters or fewer.";
  if (values.note.length > 500) errors.note = "Use 500 characters or fewer.";
  return { values, errors };
}

export function validateReversal(formData: FormData) {
  const reason = text(formData, "reason");
  if (reason.length < 3) return { reason, error: "Say why, like the refund or chargeback reference." };
  if (reason.length > 300) return { reason, error: "Use 300 characters or fewer." };
  return { reason, error: undefined };
}
