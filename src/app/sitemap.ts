import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-url";
import { listLiveJobSlugs } from "@/server/companies/jobs";

export const dynamic = "force-dynamic";

const PAGES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/jobs", priority: 0.9, changeFrequency: "daily" },
  { path: "/membership", priority: 0.8, changeFrequency: "monthly" },
  { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" },
  { path: "/companies", priority: 0.7, changeFrequency: "weekly" },
  { path: "/franchise", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/sign-up", priority: 0.6, changeFrequency: "yearly" },
  { path: "/sign-up/company", priority: 0.6, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/employer-terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await listLiveJobSlugs();

  return [
    ...PAGES.map(({ path, priority, changeFrequency }) => ({
      url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
      changeFrequency,
      priority,
    })),
    ...jobs.map((job) => ({
      url: `${SITE_URL}/jobs/${job.slug}`,
      lastModified: job.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
