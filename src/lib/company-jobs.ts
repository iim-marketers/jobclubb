import type { FieldErrors } from "@/lib/sign-up-validation";
import { JOB_TYPES, VERTICALS, WORK_MODES } from "@/lib/taxonomy";

export const JOB_STATUSES = ["in_review", "live", "closed", "rejected"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  in_review: "In review",
  live: "Live",
  closed: "Closed",
  rejected: "Not approved",
};

export type CompanyJob = {
  id: string;
  vertical: string;
  role: string;
  designation: string;
  city: string;
  pincode: string;
  jobType: (typeof JOB_TYPES)[number];
  workMode: (typeof WORK_MODES)[number];
  experienceMin: number;
  experienceMax: number;
  salaryMinLpa: number;
  salaryMaxLpa: number;
  openings: number;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  status: JobStatus;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobInput = Omit<
  CompanyJob,
  "id" | "status" | "approvedAt" | "createdAt" | "updatedAt"
>;

const PINCODE_PATTERN = /^\d{6}$/;
const MAX_LIST_ITEMS = 15;
const MAX_LIST_ITEM_LENGTH = 200;

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

const lines = (formData: FormData, key: string) =>
  text(formData, key)
    .split("\n")
    .map((l) => l.replace(/^[-•*\s]+/, "").trim())
    .filter(Boolean);

function wholeNumber(raw: string) {
  return /^\d+$/.test(raw) ? Number(raw) : NaN;
}

function lakhs(raw: string) {
  return /^\d+(\.\d{1,2})?$/.test(raw) ? Number(raw) : NaN;
}

function listError(items: string[], { required }: { required: boolean }) {
  if (required && items.length === 0) return "Add at least one, one per line.";
  if (items.length > MAX_LIST_ITEMS) return `Keep it to ${MAX_LIST_ITEMS} lines or fewer.`;
  if (items.some((i) => i.length > MAX_LIST_ITEM_LENGTH))
    return `Keep each line under ${MAX_LIST_ITEM_LENGTH} characters.`;
}

export function validateJob(formData: FormData): {
  values: JobInput;
  errors: FieldErrors;
} {
  const values: JobInput = {
    vertical: text(formData, "vertical"),
    role: text(formData, "role"),
    designation: text(formData, "designation"),
    city: text(formData, "city"),
    pincode: text(formData, "pincode"),
    jobType: text(formData, "jobType") as JobInput["jobType"],
    workMode: text(formData, "workMode") as JobInput["workMode"],
    experienceMin: wholeNumber(text(formData, "experienceMin")),
    experienceMax: wholeNumber(text(formData, "experienceMax")),
    salaryMinLpa: lakhs(text(formData, "salaryMinLpa")),
    salaryMaxLpa: lakhs(text(formData, "salaryMaxLpa")),
    openings: wholeNumber(text(formData, "openings")),
    description: text(formData, "description"),
    responsibilities: lines(formData, "responsibilities"),
    requirements: lines(formData, "requirements"),
    benefits: lines(formData, "benefits"),
  };
  const errors: FieldErrors = {};

  const vertical = VERTICALS.find((v) => v.slug === values.vertical);
  if (!vertical) errors.vertical = "Choose a sector.";
  else if (!vertical.roles.includes(values.role)) errors.role = "Choose a role.";
  if (!values.designation) errors.designation = "Enter the job title candidates will see.";
  else if (values.designation.length > 120) errors.designation = "Use 120 characters or fewer.";
  if (!values.city) errors.city = "Enter the city.";
  else if (values.city.length > 80) errors.city = "Use 80 characters or fewer.";
  if (!PINCODE_PATTERN.test(values.pincode)) errors.pincode = "Enter a 6-digit pincode.";
  if (!JOB_TYPES.includes(values.jobType)) errors.jobType = "Choose a job type.";
  if (!WORK_MODES.includes(values.workMode)) errors.workMode = "Choose a work mode.";

  if (!(values.experienceMin >= 0 && values.experienceMin <= 40))
    errors.experienceMin = "Enter years from 0 to 40.";
  if (!(values.experienceMax >= 0 && values.experienceMax <= 40))
    errors.experienceMax = "Enter years from 0 to 40.";
  else if (values.experienceMax < values.experienceMin)
    errors.experienceMax = "Can't be less than the minimum.";

  if (!(values.salaryMinLpa > 0 && values.salaryMinLpa <= 100))
    errors.salaryMinLpa = "Enter lakhs per year, like 3.5.";
  if (!(values.salaryMaxLpa > 0 && values.salaryMaxLpa <= 100))
    errors.salaryMaxLpa = "Enter lakhs per year, like 5.";
  else if (values.salaryMaxLpa < values.salaryMinLpa)
    errors.salaryMaxLpa = "Can't be less than the minimum.";

  if (!(values.openings >= 1 && values.openings <= 999))
    errors.openings = "Enter from 1 to 999 openings.";

  if (values.description.length < 30)
    errors.description = "Describe the role in at least 30 characters.";
  else if (values.description.length > 4000)
    errors.description = "Use 4,000 characters or fewer.";

  const responsibilities = listError(values.responsibilities, { required: true });
  if (responsibilities) errors.responsibilities = responsibilities;
  const requirements = listError(values.requirements, { required: true });
  if (requirements) errors.requirements = requirements;
  const benefits = listError(values.benefits, { required: false });
  if (benefits) errors.benefits = benefits;

  return { values, errors };
}

const lpa = (n: number) => `₹${Number(n.toFixed(2))} LPA`;

export function formatSalary(job: Pick<CompanyJob, "salaryMinLpa" | "salaryMaxLpa">) {
  return job.salaryMinLpa === job.salaryMaxLpa
    ? lpa(job.salaryMinLpa)
    : `${lpa(job.salaryMinLpa)} – ${lpa(job.salaryMaxLpa)}`;
}

export function formatExperience(job: Pick<CompanyJob, "experienceMin" | "experienceMax">) {
  if (job.experienceMax === 0) return "Fresher";
  const unit = job.experienceMax === 1 ? "year" : "years";
  return job.experienceMin === job.experienceMax
    ? `${job.experienceMin} ${unit}`
    : `${job.experienceMin} – ${job.experienceMax} ${unit}`;
}

export function formatPostedDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

export function verticalName(slug: string) {
  return VERTICALS.find((v) => v.slug === slug)?.name ?? slug;
}

export type JobFormDefaults = Record<
  Exclude<keyof JobInput, "role">,
  string
> & { role: string | null };

export function jobFormDefaults(
  job: CompanyJob | null,
  company: { sector: string; city: string; pincode: string },
): JobFormDefaults {
  if (!job)
    return {
      vertical: company.sector,
      role: null,
      designation: "",
      openings: "1",
      city: company.city,
      pincode: company.pincode,
      jobType: "Full time",
      workMode: "Onsite",
      experienceMin: "0",
      experienceMax: "",
      salaryMinLpa: "",
      salaryMaxLpa: "",
      description: "",
      responsibilities: "",
      requirements: "",
      benefits: "",
    };

  return {
    vertical: job.vertical,
    role: job.role,
    designation: job.designation,
    openings: String(job.openings),
    city: job.city,
    pincode: job.pincode,
    jobType: job.jobType,
    workMode: job.workMode,
    experienceMin: String(job.experienceMin),
    experienceMax: String(job.experienceMax),
    salaryMinLpa: String(job.salaryMinLpa),
    salaryMaxLpa: String(job.salaryMaxLpa),
    description: job.description,
    responsibilities: job.responsibilities.join("\n"),
    requirements: job.requirements.join("\n"),
    benefits: job.benefits.join("\n"),
  };
}
