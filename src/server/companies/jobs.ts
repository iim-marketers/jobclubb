import "server-only";

import type { CompanyJob, JobInput } from "@/lib/company-jobs";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { sanitizeRichText } from "@/server/rich-text";

const COLUMNS =
  "id, vertical, role, designation, city, pincode, job_type, work_mode, experience_min, experience_max, salary_min_lpa, salary_max_lpa, openings, description, responsibilities, requirements, benefits, status, approved_at, created_at, updated_at";

type JobRow = {
  id: string;
  vertical: string;
  role: string;
  designation: string;
  city: string;
  pincode: string;
  job_type: CompanyJob["jobType"];
  work_mode: CompanyJob["workMode"];
  experience_min: number;
  experience_max: number;
  salary_min_lpa: number | string;
  salary_max_lpa: number | string;
  openings: number;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  status: CompanyJob["status"];
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

function toJob(row: JobRow): CompanyJob {
  return {
    id: row.id,
    vertical: row.vertical,
    role: row.role,
    designation: row.designation,
    city: row.city,
    pincode: row.pincode,
    jobType: row.job_type,
    workMode: row.work_mode,
    experienceMin: row.experience_min,
    experienceMax: row.experience_max,
    // PostgREST returns numeric columns as strings.
    salaryMinLpa: Number(row.salary_min_lpa),
    salaryMaxLpa: Number(row.salary_max_lpa),
    openings: row.openings,
    description: row.description,
    responsibilities: row.responsibilities,
    requirements: row.requirements,
    benefits: row.benefits,
    status: row.status,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(input: JobInput) {
  return {
    vertical: input.vertical,
    role: input.role,
    designation: input.designation,
    city: input.city,
    pincode: input.pincode,
    job_type: input.jobType,
    work_mode: input.workMode,
    experience_min: input.experienceMin,
    experience_max: input.experienceMax,
    salary_min_lpa: input.salaryMinLpa,
    salary_max_lpa: input.salaryMaxLpa,
    openings: input.openings,
    description: sanitizeRichText(input.description),
    responsibilities: input.responsibilities,
    requirements: input.requirements,
    benefits: input.benefits,
  };
}

export async function listCompanyJobs(companyId: string): Promise<CompanyJob[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_jobs")
    .select(COLUMNS)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as JobRow[]).map(toJob);
}

export async function getCompanyJob(companyId: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_jobs")
    .select(COLUMNS)
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toJob(data as JobRow) : null;
}

export async function createCompanyJob(companyId: string, input: JobInput) {
  const { data, error } = await createAdminClient()
    .from("company_jobs")
    .insert({ ...toRow(input), company_id: companyId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

// Any edit sends the posting back to review, including a live one.
export async function updateCompanyJob(companyId: string, id: string, input: JobInput) {
  const { data, error } = await createAdminClient()
    .from("company_jobs")
    .update({ ...toRow(input), status: "in_review", updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("id", id)
    .neq("status", "closed")
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

export async function setCompanyJobOpen(companyId: string, id: string, open: boolean) {
  const job = await getCompanyJob(companyId, id);
  if (!job) return false;
  if (open ? job.status !== "closed" : job.status === "closed" || job.status === "rejected")
    return false;

  const status = open ? (job.approvedAt ? "live" : "in_review") : "closed";
  const { error } = await createAdminClient()
    .from("company_jobs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("id", id);
  if (error) throw error;
  return true;
}
