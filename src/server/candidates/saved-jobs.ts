import "server-only";

import type { SavedJob } from "@/lib/candidate-activity";
import { createAdminClient } from "@/lib/supabase/server";
import {
  PUBLIC_JOB_COLUMNS,
  toPublicJob,
  type PublicJobRow,
} from "@/server/companies/jobs";
import { toListing } from "@/server/jobs/listings";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function listSavedJobs(candidateId: string): Promise<SavedJob[]> {
  const { data, error } = await createAdminClient()
    .from("saved_jobs")
    .select(`created_at, company_jobs (${PUBLIC_JOB_COLUMNS})`)
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (
    data as unknown as { created_at: string; company_jobs: PublicJobRow }[]
  ).map((row) => {
    const job = toPublicJob(row.company_jobs);
    return {
      job: toListing(job),
      savedAt: row.created_at,
      postedAt: job.createdAt,
      closed: job.status !== "live",
    };
  });
}

export async function listSavedJobSlugs(candidateId: string): Promise<string[]> {
  const { data, error } = await createAdminClient()
    .from("saved_jobs")
    .select("company_jobs (slug)")
    .eq("candidate_id", candidateId);
  if (error) throw error;
  return (data as unknown as { company_jobs: { slug: string } }[]).map(
    (row) => row.company_jobs.slug,
  );
}

export async function isJobSaved(candidateId: string, slug: string) {
  const { count, error } = await createAdminClient()
    .from("saved_jobs")
    .select("candidate_id, company_jobs!inner (slug)", { count: "exact", head: true })
    .eq("candidate_id", candidateId)
    .eq("company_jobs.slug", slug);
  if (error) throw error;
  return !!count;
}

// Only live jobs can be saved, so a closed job's details stay out of reach
// unless the candidate saved it while it was open.
export async function setJobSaved(
  candidateId: string,
  slug: string,
  saved: boolean,
): Promise<boolean> {
  if (!SLUG.test(slug)) return false;
  const admin = createAdminClient();

  let jobQuery = admin.from("company_jobs").select("id").eq("slug", slug);
  if (saved) jobQuery = jobQuery.eq("status", "live");
  const { data: job, error: jobError } = await jobQuery.maybeSingle();
  if (jobError) throw jobError;
  if (!job) return !saved;

  const { error } = saved
    ? await admin
        .from("saved_jobs")
        .upsert(
          { candidate_id: candidateId, job_id: job.id },
          { onConflict: "candidate_id,job_id", ignoreDuplicates: true },
        )
    : await admin
        .from("saved_jobs")
        .delete()
        .eq("candidate_id", candidateId)
        .eq("job_id", job.id);
  if (error) throw error;
  return true;
}
