import "server-only";

import { jobSlug, type CompanyJob, type JobInput, type JobLocation } from "@/lib/company-jobs";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCompanyLogoUrl } from "@/server/companies/logo";
import { sanitizeRichText } from "@/server/rich-text";

const COLUMNS =
  "id, slug, industry, role, designation, city, pincode, job_type, work_mode, experience_min, experience_max, salary_min_lpa, salary_max_lpa, openings, description, responsibilities, requirements, benefits, status, created_at, updated_at";

type JobRow = {
  id: string;
  slug: string;
  industry: string;
  role: string;
  designation: string;
  city: string;
  pincode: string;
  job_type: CompanyJob["jobType"];
  work_mode: CompanyJob["workMode"];
  experience_min: number;
  experience_max: number;
  salary_min_lpa: number | string | null;
  salary_max_lpa: number | string | null;
  openings: number;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  status: CompanyJob["status"];
  created_at: string;
  updated_at: string;
};

function toJob(row: JobRow): CompanyJob {
  return {
    id: row.id,
    slug: row.slug,
    industry: row.industry,
    role: row.role,
    designation: row.designation,
    city: row.city,
    pincode: row.pincode,
    jobType: row.job_type,
    workMode: row.work_mode,
    experienceMin: row.experience_min,
    experienceMax: row.experience_max,
    // PostgREST returns numeric columns as strings.
    salaryMinLpa: row.salary_min_lpa === null ? null : Number(row.salary_min_lpa),
    salaryMaxLpa: row.salary_max_lpa === null ? null : Number(row.salary_max_lpa),
    openings: row.openings,
    description: row.description,
    responsibilities: row.responsibilities,
    requirements: row.requirements,
    benefits: row.benefits,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// For property companies a database trigger overwrites city and pincode with
// the property's, so only partners pass a location.
function toRow(input: JobInput, location: JobLocation | null) {
  return {
    ...location,
    industry: input.industry,
    role: input.role,
    designation: input.designation,
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

export async function createCompanyJob(
  companyId: string,
  input: JobInput,
  location: JobLocation | null,
) {
  const admin = createAdminClient();
  for (let attempt = 0; ; attempt++) {
    const { data, error } = await admin
      .from("company_jobs")
      .insert({ ...toRow(input, location), company_id: companyId, slug: jobSlug(input.designation) })
      .select("id")
      .single();
    if (!error) return data.id as string;
    const slugTaken = error.code === "23505" && error.message.includes("company_jobs_slug_key");
    if (!slugTaken || attempt >= 2) throw error;
  }
}

export type PublicJob = CompanyJob & {
  companyName: string;
  companyLogoUrl: string | null;
};

export type PublicJobRow = JobRow & {
  companies: { company_name: string; logo_path: string | null } | null;
};

export const PUBLIC_JOB_COLUMNS = `${COLUMNS}, companies (company_name, logo_path)`;

export function toPublicJob(row: PublicJobRow): PublicJob {
  return {
    ...toJob(row),
    companyName: row.companies?.company_name ?? "",
    companyLogoUrl: getCompanyLogoUrl(row.companies?.logo_path ?? null),
  };
}

// The queries below bypass RLS, so they must keep the live-only filter.
export async function listLiveJobs(limit?: number): Promise<PublicJob[]> {
  let query = createAdminClient()
    .from("company_jobs")
    .select(PUBLIC_JOB_COLUMNS)
    .eq("status", "live")
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as PublicJobRow[]).map(toPublicJob);
}

export async function listLiveJobSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  const { data, error } = await createAdminClient()
    .from("company_jobs")
    .select("slug, updated_at")
    .eq("status", "live")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({ slug: row.slug, updatedAt: row.updated_at }));
}

export type LiveJobSearch = {
  q: string;
  loc: string;
  industries: string[];
  jobTypes: string[];
  workModes: string[];
  titlesOnly: boolean;
  sort: "recent" | "salary" | "experience";
  limit: number;
};

type SearchRow = JobRow & {
  company_name: string;
  logo_path: string | null;
  total_count: number;
};

export async function searchLiveJobs(
  search: LiveJobSearch,
): Promise<{ jobs: PublicJob[]; total: number }> {
  const { data, error } = await createAdminClient().rpc("search_live_jobs", {
    search_text: search.q,
    place: search.loc,
    industries: search.industries,
    job_types: search.jobTypes,
    work_modes: search.workModes,
    titles_only: search.titlesOnly,
    sort_by: search.sort,
    max_rows: search.limit,
  });
  if (error) throw error;
  const rows = data as SearchRow[];
  return {
    jobs: rows.map(({ company_name, logo_path, ...row }) =>
      toPublicJob({ ...row, companies: { company_name, logo_path } }),
    ),
    total: Number(rows[0]?.total_count ?? 0),
  };
}

export async function liveJobFacets(q: string, loc: string) {
  const { data, error } = await createAdminClient().rpc("live_job_facets", {
    search_text: q,
    place: loc,
  });
  if (error) throw error;
  return (data as { facet: string; value: string; jobs: number }[]).map(
    (row) => ({ ...row, jobs: Number(row.jobs) }),
  );
}

export async function getLiveJobBySlug(slug: string): Promise<PublicJob | null> {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const { data, error } = await createAdminClient()
    .from("company_jobs")
    .select(PUBLIC_JOB_COLUMNS)
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();
  if (error) throw error;
  return data ? toPublicJob(data as unknown as PublicJobRow) : null;
}

export async function updateCompanyJob(
  companyId: string,
  id: string,
  input: JobInput,
  location: JobLocation | null,
) {
  const { data, error } = await createAdminClient()
    .from("company_jobs")
    .update({ ...toRow(input, location), updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("id", id)
    .neq("status", "closed")
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

export async function setCompanyJobOpen(companyId: string, id: string, open: boolean) {
  const { data, error } = await createAdminClient()
    .from("company_jobs")
    .update({ status: open ? "live" : "closed", updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("id", id)
    .eq("status", open ? "closed" : "live")
    .select("id");
  if (error) throw error;
  return data.length > 0;
}
