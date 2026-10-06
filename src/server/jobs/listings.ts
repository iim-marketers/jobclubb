import "server-only";

import {
  formatExperience,
  formatSalary,
  industryName,
} from "@/lib/company-jobs";
import { getJob as getSampleJob, type JobListing } from "@/lib/jobs-data";
import { getLiveJobBySlug, type PublicJob } from "@/server/companies/jobs";

const DAY = 24 * 60 * 60 * 1000;

function postedAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
  if (days < 1) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? "1 month ago" : `${months} months ago`;
}

function toListing(job: PublicJob): JobListing {
  return {
    slug: job.slug,
    title: job.role,
    designation: job.designation,
    company: job.companyName,
    industry: industryName(job.industry),
    location: job.city,
    pincode: job.pincode,
    salaryRange: formatSalary(job),
    experience: formatExperience(job),
    jobType: job.jobType,
    workMode: job.workMode,
    postedAgo: postedAgo(job.approvedAt ?? job.createdAt),
    description: job.description,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    benefits: job.benefits,
  };
}

export async function getJob(slug: string): Promise<JobListing | null> {
  const job = await getLiveJobBySlug(slug);
  if (job) return toListing(job);
  return getSampleJob(slug) ?? null;
}
