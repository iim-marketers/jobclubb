import "server-only";

import {
  formatExperience,
  formatSalary,
  industryName,
} from "@/lib/company-jobs";
import type { JobListing } from "@/lib/jobs-data";
import {
  getLiveJobBySlug,
  listLiveJobs,
  type PublicJob,
} from "@/server/companies/jobs";

const DAY = 24 * 60 * 60 * 1000;

export function postedAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
  if (days < 1) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? "1 month ago" : `${months} months ago`;
}

export function toListing(job: PublicJob): JobListing {
  return {
    slug: job.slug,
    title: job.role,
    designation: job.designation,
    company: job.companyName,
    companyLogoUrl: job.companyLogoUrl,
    industry: industryName(job.industry),
    location: job.city,
    pincode: job.pincode,
    salaryRange: formatSalary(job),
    experience: formatExperience(job),
    jobType: job.jobType,
    workMode: job.workMode,
    postedAgo: postedAgo(job.createdAt),
    description: job.description,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    benefits: job.benefits,
  };
}

export async function listJobs(limit?: number): Promise<JobListing[]> {
  return (await listLiveJobs(limit)).map(toListing);
}

export async function getJob(slug: string): Promise<JobListing | null> {
  const job = await getLiveJobBySlug(slug);
  return job ? toListing(job) : null;
}
