import { JOB_TYPES, INDUSTRIES, WORK_MODES } from "@/lib/taxonomy";

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
    return {
      q,
      loc: "",
      sectors: [],
      jobTypes: [],
      workModes: [],
      sort: "recent",
    };
  }
  const sort = first(params.sort);
  return {
    q,
    loc: first(params.loc),
    sectors: allowed(
      list(params.sector),
      INDUSTRIES.map((v) => v.name),
    ),
    jobTypes: allowed(list(params.type), JOB_TYPES),
    workModes: allowed(list(params.mode), WORK_MODES),
    sort: sort in SORTS ? (sort as JobSort) : "recent",
  };
}

export type FacetCounts = Record<
  "sectors" | "jobTypes" | "workModes",
  Record<string, number>
>;

export const PAGE_SIZE = 20;
export const MAX_RESULTS = 1000;

export type Paging = { page: number; limit: number };

function clamp(value: number, min: number, max: number, fallback: number) {
  return Number.isInteger(value)
    ? Math.min(Math.max(value, min), max)
    : fallback;
}

export function parsePaging(params: RawParams): Paging {
  const limit = clamp(parseInt(first(params.limit), 10), 1, 50, PAGE_SIZE);
  const page = clamp(
    parseInt(first(params.page), 10),
    1,
    Math.floor(MAX_RESULTS / limit),
    1,
  );
  return { page, limit };
}

export function jobsHref(
  query: JobQuery,
  paging: Paging = { page: 1, limit: PAGE_SIZE },
) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.loc) params.set("loc", query.loc);
  query.sectors.forEach((s) => params.append("sector", s));
  query.jobTypes.forEach((t) => params.append("type", t));
  query.workModes.forEach((m) => params.append("mode", m));
  if (query.sort !== "recent") params.set("sort", query.sort);
  params.set("page", String(paging.page));
  params.set("limit", String(paging.limit));
  return `/jobs?${params}`;
}
