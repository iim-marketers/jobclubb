// Sign-up field rules shared by the step-by-step forms (per-step checks) and
// the server actions (final enforcement), so the two can never disagree.

import {
  COMPANY_SIZES,
  SEAT_PLANS,
  assessCompanyVerification,
  getWebsiteDomain,
} from "@/lib/company-verification";
import { VERTICALS } from "@/lib/taxonomy";

export type FieldErrors = Partial<Record<string, string>>;

export type SignUpStep = {
  title: string;
  description: string;
  fields: string[];
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^(\+?91[\s-]?)?[6-9]\d{4}\s?\d{5}$/;
const PINCODE_PATTERN = /^\d{6}$/;
const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const CODE_PATTERN = /^[A-Z0-9-]{4,24}$/;

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const UPLOAD_TYPES = ["application/pdf", "image/jpeg", "image/png"];

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function checkUpload(file: File | null): string | undefined {
  if (!file) return undefined;
  if (!UPLOAD_TYPES.includes(file.type)) return "Upload a PDF, JPG or PNG.";
  if (file.size > MAX_UPLOAD_BYTES) return "Files must be 5 MB or smaller.";
}

export function firstStepWithError(steps: SignUpStep[], errors: FieldErrors) {
  const index = steps.findIndex((s) => s.fields.some((f) => errors[f]));
  return index === -1 ? steps.length - 1 : index;
}

export function pickErrors(errors: FieldErrors, fields: string[]): FieldErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([key]) => fields.includes(key)),
  );
}

// ---------------------------------------------------------------- Candidate

export const CANDIDATE_STEPS: SignUpStep[] = [
  {
    title: "About you",
    description: "How employers reach you once you choose to reveal your profile.",
    fields: ["firstName", "lastName", "email", "phone"],
  },
  {
    title: "Your preferences",
    description: "We use these to match you with openings near you.",
    fields: ["city", "pincode", "vertical"],
  },
  {
    title: "Finish up",
    description: "Tell us how you found us and accept the terms.",
    fields: ["source", "code", "studentId", "acceptTerms"],
  },
];

export function isStudentCode(code: string) {
  return code.trim().toUpperCase().startsWith("JC-STU-");
}

export function validateCandidate(formData: FormData): FieldErrors {
  const v = {
    firstName: readText(formData, "firstName"),
    lastName: readText(formData, "lastName"),
    email: readText(formData, "email"),
    phone: readText(formData, "phone"),
    city: readText(formData, "city"),
    pincode: readText(formData, "pincode"),
    vertical: readText(formData, "vertical"),
    source: readText(formData, "source"),
    code: readText(formData, "code").toUpperCase(),
    acceptTerms: readText(formData, "acceptTerms"),
  };
  const studentId = readFile(formData, "studentId");
  const errors: FieldErrors = {};

  if (!v.firstName) errors.firstName = "Enter your first name.";
  if (!v.lastName) errors.lastName = "Enter your last name.";
  if (!EMAIL_PATTERN.test(v.email)) errors.email = "Enter a valid email address.";
  if (!PHONE_PATTERN.test(v.phone)) errors.phone = "Enter a valid 10-digit Indian mobile number.";
  if (!v.city) errors.city = "Enter your city.";
  if (!PINCODE_PATTERN.test(v.pincode)) errors.pincode = "Enter a 6-digit pincode.";
  if (!VERTICALS.some((s) => s.slug === v.vertical)) errors.vertical = "Choose a sector.";
  if (!v.source) errors.source = "Tell us how you heard about JobClubb.";
  if (v.code && !CODE_PATTERN.test(v.code)) errors.code = "Codes look like JC-STU-7F2A.";
  // SOP §3.3: student membership eligibility is proven with a student ID upload.
  if (isStudentCode(v.code) && !studentId) errors.studentId = "Upload your student ID to use a student code.";
  const uploadError = checkUpload(studentId);
  if (uploadError) errors.studentId = uploadError;
  // SOP §3.5: T&C acceptance is only possible after the scroll-gated read.
  if (v.acceptTerms !== "yes") errors.acceptTerms = "Read and accept the Terms & Conditions.";

  return errors;
}

// ------------------------------------------------------------------ Company

export const COMPANY_STEPS: SignUpStep[] = [
  {
    title: "Company",
    description: "Tell us about the business you're hiring for.",
    fields: ["companyName", "sector", "size", "website", "gstin", "city", "pincode"],
  },
  {
    title: "Admin account",
    description: "You'll manage job postings and HR seats for your company.",
    fields: ["contactName", "designation", "email", "phone", "password", "confirmPassword"],
  },
  {
    title: "Plan & verification",
    description: "Pick a plan and help us verify your company.",
    fields: ["plan", "proof", "acceptTerms"],
  },
];

export function validateCompany(formData: FormData): FieldErrors {
  const v = {
    companyName: readText(formData, "companyName"),
    sector: readText(formData, "sector"),
    size: readText(formData, "size"),
    website: readText(formData, "website"),
    gstin: readText(formData, "gstin").toUpperCase(),
    city: readText(formData, "city"),
    pincode: readText(formData, "pincode"),
    contactName: readText(formData, "contactName"),
    designation: readText(formData, "designation"),
    email: readText(formData, "email").toLowerCase(),
    phone: readText(formData, "phone"),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    plan: readText(formData, "plan"),
    acceptTerms: readText(formData, "acceptTerms"),
  };
  const proof = readFile(formData, "proof");
  const errors: FieldErrors = {};

  if (!v.companyName) errors.companyName = "Enter your company's registered name.";
  if (!VERTICALS.some((s) => s.slug === v.sector)) errors.sector = "Choose a sector.";
  if (!COMPANY_SIZES.some((s) => s.value === v.size)) errors.size = "Choose your company size.";
  if (v.website && !getWebsiteDomain(v.website)) errors.website = "Enter a valid website, like taj.com.";
  if (v.gstin && !GSTIN_PATTERN.test(v.gstin)) errors.gstin = "GSTIN should be 15 characters, like 19AABCT1234F1Z5.";
  if (!v.city) errors.city = "Enter your city.";
  if (!PINCODE_PATTERN.test(v.pincode)) errors.pincode = "Enter a 6-digit pincode.";
  if (!v.contactName) errors.contactName = "Enter your full name.";
  if (!v.designation) errors.designation = "Enter your designation.";
  if (!PHONE_PATTERN.test(v.phone)) errors.phone = "Enter a valid 10-digit Indian mobile number.";
  if (v.password.length < 8) errors.password = "Use at least 8 characters.";
  else if (v.password !== v.confirmPassword) errors.confirmPassword = "Passwords don't match.";
  if (!SEAT_PLANS.some((p) => p.value === v.plan)) errors.plan = "Choose a plan.";
  if (v.acceptTerms !== "yes") errors.acceptTerms = "Read and accept the Terms & Conditions.";

  // SOP §4.4: large companies must use a corporate email; everyone else on a
  // free-mail address (or a mismatched domain) goes to manual verification.
  const assessment = assessCompanyVerification(v);
  if (!assessment) errors.email = "Enter a valid work email address.";
  else if (assessment.route === "blocked") errors.email = assessment.reason;

  const uploadError = checkUpload(proof);
  if (uploadError) errors.proof = uploadError;
  else if (!proof && assessment?.route === "manual" && !v.gstin) {
    errors.proof = "Add your GSTIN or upload a business document so we can verify your company.";
  }

  return errors;
}

// ---------------------------------------------------------------- Franchise

// SOP §5.1: franchise partners sign up with the franchise-specific email ID
// issued to them by JobClubb head office (e.g. pune.west@jobclubb.com).
export const FRANCHISE_EMAIL_DOMAIN = "jobclubb.com";

export const BUSINESS_TYPES = [
  { value: "individual", label: "Individual / Proprietorship" },
  { value: "partnership", label: "Partnership firm" },
  { value: "llp", label: "LLP" },
  { value: "private-limited", label: "Private Limited" },
] as const;

const PAN_PATTERN = /^[A-Z]{5}\d{4}[A-Z]$/;

export const FRANCHISE_STEPS: SignUpStep[] = [
  {
    title: "Franchise ID",
    description: "Use the franchise email ID issued to you by JobClubb head office.",
    fields: ["email", "franchiseName", "city", "pincode"],
  },
  {
    title: "Business details",
    description: "The business your franchise operates under — used for verification and payouts.",
    fields: ["businessName", "businessType", "pan", "gstin", "address"],
  },
  {
    title: "Owner & login",
    description: "Who runs this franchise, and the password for your dashboard.",
    fields: ["ownerName", "phone", "password", "confirmPassword", "acceptTerms"],
  },
];

export function isFranchiseEmail(email: string) {
  return email.trim().toLowerCase().endsWith(`@${FRANCHISE_EMAIL_DOMAIN}`);
}

export function validateFranchise(formData: FormData): FieldErrors {
  const v = {
    email: readText(formData, "email").toLowerCase(),
    franchiseName: readText(formData, "franchiseName"),
    city: readText(formData, "city"),
    pincode: readText(formData, "pincode"),
    businessName: readText(formData, "businessName"),
    businessType: readText(formData, "businessType"),
    pan: readText(formData, "pan").toUpperCase(),
    gstin: readText(formData, "gstin").toUpperCase(),
    address: readText(formData, "address"),
    ownerName: readText(formData, "ownerName"),
    phone: readText(formData, "phone"),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    acceptTerms: readText(formData, "acceptTerms"),
  };
  const errors: FieldErrors = {};

  if (!EMAIL_PATTERN.test(v.email)) errors.email = "Enter your franchise email ID.";
  else if (!isFranchiseEmail(v.email)) errors.email = `Use the @${FRANCHISE_EMAIL_DOMAIN} franchise email ID issued to you, not a personal address.`;
  if (!v.franchiseName) errors.franchiseName = "Enter your franchise name, like Kolkata South.";
  if (!v.city) errors.city = "Enter your territory city.";
  if (!PINCODE_PATTERN.test(v.pincode)) errors.pincode = "Enter a 6-digit pincode.";
  if (!v.businessName) errors.businessName = "Enter your registered business name.";
  if (!BUSINESS_TYPES.some((t) => t.value === v.businessType)) errors.businessType = "Choose a business type.";
  if (!PAN_PATTERN.test(v.pan)) errors.pan = "PAN should be 10 characters, like ABCDE1234F.";
  if (v.gstin && !GSTIN_PATTERN.test(v.gstin)) errors.gstin = "GSTIN should be 15 characters, like 19AABCT1234F1Z5.";
  if (v.address.length < 10) errors.address = "Enter your full office address.";
  if (!v.ownerName) errors.ownerName = "Enter the owner's full name.";
  if (!PHONE_PATTERN.test(v.phone)) errors.phone = "Enter a valid 10-digit Indian mobile number.";
  if (v.password.length < 8) errors.password = "Use at least 8 characters.";
  else if (v.password !== v.confirmPassword) errors.confirmPassword = "Passwords don't match.";
  if (v.acceptTerms !== "yes") errors.acceptTerms = "Read and accept the Terms & Conditions.";

  return errors;
}
