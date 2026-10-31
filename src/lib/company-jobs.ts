import { pincodeState } from "@/lib/gst";
import { richTextToPlain, toRichTextHtml } from "@/lib/rich-text";
import type { FieldErrors } from "@/lib/sign-up-validation";
import {
  ALL_INDUSTRIES,
  JOB_TYPES,
  INDUSTRIES,
  WORK_MODES,
  jobRoles,
} from "@/lib/taxonomy";

export const JOB_STATUSES = ["live", "closed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  live: "Live",
  closed: "Closed",
};

export type CompanyJob = {
  id: string;
  slug: string;
  industry: string;
  role: string;
  designation: string;
  city: string;
  pincode: string;
  jobType: (typeof JOB_TYPES)[number];
  workMode: (typeof WORK_MODES)[number];
  experienceMin: number | null;
  experienceMax: number | null;
  // Both null when the company doesn't disclose pay; max alone null for
  // a minimum-only salary.
  salaryMinLpa: number | null;
  salaryMaxLpa: number | null;
  openings: number | null;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
};

export type JobInput = Omit<
  CompanyJob,
  "id" | "slug" | "status" | "createdAt" | "updatedAt" | "city" | "pincode"
>;

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
  if (items.length > MAX_LIST_ITEMS)
    return `Keep it to ${MAX_LIST_ITEMS} lines or fewer.`;
  if (items.some((i) => i.length > MAX_LIST_ITEM_LENGTH))
    return `Keep each line under ${MAX_LIST_ITEM_LENGTH} characters.`;
}

export function validateJob(formData: FormData): {
  values: JobInput;
  errors: FieldErrors;
} {
  const salaryUndisclosed = text(formData, "salaryUndisclosed") === "yes";
  const experienceStated =
    !!text(formData, "experienceMin") || !!text(formData, "experienceMax");
  const values: JobInput = {
    industry: text(formData, "industry"),
    role: text(formData, "role"),
    designation: text(formData, "designation"),
    jobType: text(formData, "jobType") as JobInput["jobType"],
    workMode: text(formData, "workMode") as JobInput["workMode"],
    experienceMin: experienceStated
      ? wholeNumber(text(formData, "experienceMin"))
      : null,
    experienceMax: experienceStated
      ? wholeNumber(text(formData, "experienceMax"))
      : null,
    salaryMinLpa: salaryUndisclosed
      ? null
      : lakhs(text(formData, "salaryMinLpa")),
    salaryMaxLpa:
      salaryUndisclosed || !text(formData, "salaryMaxLpa")
        ? null
        : lakhs(text(formData, "salaryMaxLpa")),
    openings: text(formData, "openings")
      ? wholeNumber(text(formData, "openings"))
      : null,
    description: text(formData, "description"),
    responsibilities: lines(formData, "responsibilities"),
    requirements: lines(formData, "requirements"),
    benefits: lines(formData, "benefits"),
  };
  const errors: FieldErrors = {};

  const industry = INDUSTRIES.find((v) => v.slug === values.industry);
  if (!industry) errors.industry = "Choose an industry.";
  else if (!jobRoles(industry).includes(values.role))
    errors.role = "Choose a role.";
  if (!values.designation)
    errors.designation = "Enter the job title candidates will see.";
  else if (values.designation.length > 120)
    errors.designation = "Use 120 characters or fewer.";
  if (!JOB_TYPES.includes(values.jobType))
    errors.jobType = "Choose a job type.";
  if (!WORK_MODES.includes(values.workMode))
    errors.workMode = "Choose a work mode.";

  const { experienceMin, experienceMax } = values;
  if (experienceMin !== null && experienceMax !== null) {
    if (!text(formData, "experienceMin"))
      errors.experienceMin = "Enter the minimum too, or leave both blank.";
    else if (!(experienceMin >= 0 && experienceMin <= 40))
      errors.experienceMin = "Enter years from 0 to 40.";
    if (!text(formData, "experienceMax"))
      errors.experienceMax = "Enter the maximum too, or leave both blank.";
    else if (!(experienceMax >= 0 && experienceMax <= 40))
      errors.experienceMax = "Enter years from 0 to 40.";
    else if (experienceMax < experienceMin)
      errors.experienceMax = "Can't be less than the minimum.";
  }

  const { salaryMinLpa, salaryMaxLpa } = values;
  if (salaryMinLpa !== null) {
    if (!text(formData, "salaryMinLpa"))
      errors.salaryMinLpa =
        "Enter the minimum salary, or tick “Don't disclose salary”.";
    else if (!(salaryMinLpa > 0 && salaryMinLpa <= 100))
      errors.salaryMinLpa = "Enter lakhs per year, like 3.5.";
    if (salaryMaxLpa !== null && !(salaryMaxLpa > 0 && salaryMaxLpa <= 100))
      errors.salaryMaxLpa = "Enter lakhs per year, like 5.";
    else if (salaryMaxLpa !== null && salaryMaxLpa < salaryMinLpa)
      errors.salaryMaxLpa = "Can't be less than the minimum.";
  }

  if (
    values.openings !== null &&
    !(values.openings >= 1 && values.openings <= 999)
  )
    errors.openings = "Enter from 1 to 999 openings, or leave it blank.";

  const descriptionLength = richTextToPlain(values.description).length;
  // The editor submits empty markup when cleared.
  if (descriptionLength === 0) values.description = "";
  else if (descriptionLength > 4000)
    errors.description = "Use 4,000 characters or fewer.";

  const responsibilities = listError(values.responsibilities, {
    required: false,
  });
  if (responsibilities) errors.responsibilities = responsibilities;
  const requirements = listError(values.requirements, { required: false });
  if (requirements) errors.requirements = requirements;
  const benefits = listError(values.benefits, { required: false });
  if (benefits) errors.benefits = benefits;

  return { values, errors };
}

export type JobLocation = Pick<CompanyJob, "city" | "pincode">;

export function validateJobLocation(formData: FormData): {
  values: JobLocation;
  errors: FieldErrors;
} {
  const values = {
    city: text(formData, "city"),
    pincode: text(formData, "pincode"),
  };
  const errors: FieldErrors = {};
  if (!values.city) errors.city = "Enter the city this job is in.";
  else if (values.city.length > 80) errors.city = "Use 80 characters or fewer.";
  if (!/^\d{6}$/.test(values.pincode))
    errors.pincode = "Enter a 6-digit pincode.";
  else if (!pincodeState(values.pincode))
    errors.pincode = "Enter a valid Indian pincode.";
  return { values, errors };
}

const lpa = (n: number) => `₹${Number(n.toFixed(2))} LPA`;

export const SALARY_UNDISCLOSED = "Not disclosed";

export function formatSalary(
  job: Pick<CompanyJob, "salaryMinLpa" | "salaryMaxLpa">,
) {
  if (job.salaryMinLpa === null) return SALARY_UNDISCLOSED;
  if (job.salaryMaxLpa === null) return `From ${lpa(job.salaryMinLpa)}`;
  return job.salaryMinLpa === job.salaryMaxLpa
    ? lpa(job.salaryMinLpa)
    : `${lpa(job.salaryMinLpa)} – ${lpa(job.salaryMaxLpa)}`;
}

export function formatExperience({
  experienceMin: min,
  experienceMax: max,
}: Pick<CompanyJob, "experienceMin" | "experienceMax">) {
  if (min === null || max === null) return null;
  if (max === 0) return "Fresher";
  const unit = max === 1 ? "year" : "years";
  return min === max ? `${min} ${unit}` : `${min} – ${max} ${unit}`;
}

export function formatPostedDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

// Title + random suffix only: the URL is visible to non-members, so no
// company or city. Kept stable across edits so shared links keep working.
export function jobSlug(designation: string) {
  const base =
    designation
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/, "") || "job";
  const suffix = Math.random().toString(36).slice(2, 8).padEnd(6, "0");
  return `${base}-${suffix}`;
}

export function industryName(slug: string) {
  if (slug === ALL_INDUSTRIES.slug) return ALL_INDUSTRIES.name;
  return INDUSTRIES.find((v) => v.slug === slug)?.name ?? slug;
}

export type JobFormDefaults = Record<
  Exclude<keyof JobInput, "industry" | "role"> | keyof JobLocation,
  string
> & {
  industry: string | null;
  role: string | null;
  salaryUndisclosed: boolean;
};

export function jobFormDefaults(
  job: CompanyJob | null,
  company: { industry: string },
): JobFormDefaults {
  if (!job)
    return {
      industry:
        company.industry === ALL_INDUSTRIES.slug ? null : company.industry,
      role: null,
      designation: "",
      city: "",
      pincode: "",
      openings: "",
      jobType: "Full time",
      workMode: "Onsite",
      experienceMin: "",
      experienceMax: "",
      salaryMinLpa: "",
      salaryMaxLpa: "",
      salaryUndisclosed: false,
      description: "",
      responsibilities: "",
      requirements: "",
      benefits: "",
    };

  return {
    industry: job.industry,
    role: job.role,
    designation: job.designation,
    city: job.city,
    pincode: job.pincode,
    openings: job.openings === null ? "" : String(job.openings),
    jobType: job.jobType,
    workMode: job.workMode,
    experienceMin: job.experienceMin === null ? "" : String(job.experienceMin),
    experienceMax: job.experienceMax === null ? "" : String(job.experienceMax),
    salaryMinLpa: job.salaryMinLpa === null ? "" : String(job.salaryMinLpa),
    salaryMaxLpa: job.salaryMaxLpa === null ? "" : String(job.salaryMaxLpa),
    salaryUndisclosed: job.salaryMinLpa === null,
    description: toRichTextHtml(job.description),
    responsibilities: job.responsibilities.join("\n"),
    requirements: job.requirements.join("\n"),
    benefits: job.benefits.join("\n"),
  };
}
