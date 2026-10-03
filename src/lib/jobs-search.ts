import type { JobListing } from "@/lib/jobs-data";
import { JOB_TYPES, VERTICALS, WORK_MODES } from "@/lib/taxonomy";

export const SORTS = {
  recent: "Most recent",
  salary: "Salary: high to low",
  experience: "Experience: low to high",
} as const;

export type JobSort = keyof typeof SORTS;

export type JobQuery = {
  q: string;
  loc: string;
  sectors: string[];
  jobTypes: string[];
  workModes: string[];
  sort: JobSort;
};

type RawParams = Record<string, string | string[] | undefined>;

function list(value: string | string[] | undefined) {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function first(value: string | string[] | undefined) {
  return list(value)[0]?.trim() ?? "";
}

function allowed(values: string[], options: readonly string[]) {
  return values.filter((v) => options.includes(v));
}

// Guests only see the role title, so every other field is dropped from their
// query; filtering on it would reveal the hidden details by elimination.
export function parseJobQuery(params: RawParams, member: boolean): JobQuery {
  const q = first(params.q);
  if (!member) {
    return { q, loc: "", sectors: [], jobTypes: [], workModes: [], sort: "recent" };
  }
  const sort = first(params.sort);
  return {
    q,
    loc: first(params.loc),
    sectors: allowed(list(params.sector), VERTICALS.map((v) => v.name)),
    jobTypes: allowed(list(params.type), JOB_TYPES),
    workModes: allowed(list(params.mode), WORK_MODES),
    sort: sort in SORTS ? (sort as JobSort) : "recent",
  };
}

function leadingNumber(text: string) {
  return parseFloat(text.replace(/[^\d.]+/, "")) || 0;
}

function matches(haystack: string[], needle: string) {
  const n = needle.toLowerCase();
  return haystack.some((h) => h.toLowerCase().includes(n));
}

export function searchJobs(
  jobs: JobListing[],
  query: JobQuery,
  member: boolean,
) {
  const results = jobs.filter((job) => {
    if (query.q) {
      const fields = member
        ? [job.title, job.designation, job.company]
        : [job.title];
      if (!matches(fields, query.q)) return false;
    }
    if (query.loc && !matches([job.location, job.pincode], query.loc))
      return false;
    if (query.sectors.length && !query.sectors.includes(job.vertical))
      return false;
    if (query.jobTypes.length && !query.jobTypes.includes(job.jobType))
      return false;
    if (query.workModes.length && !query.workModes.includes(job.workMode))
      return false;
    return true;
  });

  if (query.sort === "salary") {
    results.sort(
      (a, b) => leadingNumber(b.salaryRange) - leadingNumber(a.salaryRange),
    );
  } else if (query.sort === "experience") {
    results.sort(
      (a, b) => leadingNumber(a.experience) - leadingNumber(b.experience),
    );
  }
  return results;
}

export type FacetCounts = Record<
  "sectors" | "jobTypes" | "workModes",
  Record<string, number>
>;

// Counts ignore the selected facets so they stay stable while the mobile sheet
// edits a draft that hasn't hit the server yet.
export function facetCounts(
  jobs: JobListing[],
  query: JobQuery,
  member: boolean,
): FacetCounts {
  const base = searchJobs(
    jobs,
    { ...query, sectors: [], jobTypes: [], workModes: [] },
    member,
  );
  const tally = (pick: (job: JobListing) => string) => {
    const counts: Record<string, number> = {};
    for (const job of base) counts[pick(job)] = (counts[pick(job)] ?? 0) + 1;
    return counts;
  };
  return {
    sectors: tally((j) => j.vertical),
    jobTypes: tally((j) => j.jobType),
    workModes: tally((j) => j.workMode),
  };
}

export function jobsHref(query: JobQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.loc) params.set("loc", query.loc);
  query.sectors.forEach((s) => params.append("sector", s));
  query.jobTypes.forEach((t) => params.append("type", t));
  query.workModes.forEach((m) => params.append("mode", m));
  if (query.sort !== "recent") params.set("sort", query.sort);
  return params.size ? `/jobs?${params}` : "/jobs";
}
