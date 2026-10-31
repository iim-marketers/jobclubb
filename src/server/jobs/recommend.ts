import "server-only";

import type { JobListing } from "@/lib/jobs-data";
import { ALL_DEPARTMENTS, INDUSTRIES } from "@/lib/taxonomy";

import PINCODE_GEO from "./pincode-geo.json";

const RECOMMENDED = 6;

export type JobPick = { job: JobListing; reasons: string[] };

export type JobPicks = {
  matched: boolean;
  nearby: boolean;
  matches: number;
  items: JobPick[];
};

const geo: Record<string, number[] | undefined> = PINCODE_GEO;

const PINCODE = /^\d{6}$/;
const locate = (pincode?: string | null) => {
  const code = pincode?.trim() ?? "";
  return PINCODE.test(code) && Object.hasOwn(geo, code) ? geo[code] : undefined;
};

// A third element marks a pincode placed only at its district centre.
export function pincodeDistanceKm(a?: string | null, b?: string | null) {
  const from = locate(a);
  const to = locate(b);
  if (!from || !to) return null;
  const rad = Math.PI / 180;
  const h =
    Math.sin(((to[0] - from[0]) * rad) / 2) ** 2 +
    Math.cos(from[0] * rad) *
      Math.cos(to[0] * rad) *
      Math.sin(((to[1] - from[1]) * rad) / 2) ** 2;
  return {
    km: 12_742 * Math.asin(Math.sqrt(h)),
    approximate: from.length > 2 || to.length > 2,
  };
}

const CITY_ALIASES: Record<string, string> = {
  allahabad: "prayagraj",
  bangalore: "bengaluru",
  baroda: "vadodara",
  belgaum: "belagavi",
  benares: "varanasi",
  bombay: "mumbai",
  calcutta: "kolkata",
  calicut: "kozhikode",
  cochin: "kochi",
  gurgaon: "gurugram",
  madras: "chennai",
  mangalore: "mangaluru",
  mysore: "mysuru",
  "new delhi": "delhi",
  panjim: "panaji",
  pondicherry: "puducherry",
  poona: "pune",
  simla: "shimla",
  trivandrum: "thiruvananthapuram",
  vizag: "visakhapatnam",
};

const normaliseCity = (city?: string | null) => {
  const name = (city ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return CITY_ALIASES[name] ?? name;
};

// The first three pincode digits mark the sorting district, which keeps a
// suburb like Bidhannagar (700091) matched with Kolkata (700001).
const sameArea = (a?: string | null, b?: string | null) =>
  !!a && !!b && PINCODE.test(a.trim()) && a.trim().slice(0, 3) === b.trim().slice(0, 3);

function nearness(
  job: JobListing,
  profile: { city?: string | null; pincode?: string | null },
): { score: number; reason?: string } {
  const city = normaliseCity(profile.city);
  const inCity = !!city && normaliseCity(job.location) === city;
  const distance = pincodeDistanceKm(profile.pincode, job.pincode);
  if (distance === null) {
    if (inCity) return { score: 4, reason: "In your city" };
    return sameArea(job.pincode, profile.pincode)
      ? { score: 4, reason: "Near you" }
      : { score: 0 };
  }
  const { km, approximate } = distance;
  const score = km <= 15 ? 5 : km <= 30 ? 4 : km <= 60 ? 2 : 0;
  // India Post coordinates are wrong for a few offices, so a same-city job
  // counts as near whatever its pincode says.
  if (score < 4 && inCity) return { score: 4, reason: "In your city" };
  if (!score) return { score };
  if (approximate) return score >= 4 ? { score: 4, reason: "Near you" } : { score };
  return { score, reason: km < 1 ? "In your area" : `${Math.round(km)} km away` };
}

export function recommendJobs(
  jobs: JobListing[],
  profile: {
    sector?: string;
    city?: string | null;
    pincode?: string | null;
    roles?: string[] | null;
  },
): JobPicks {
  const roles = (profile.roles ?? []).flatMap((r) => r?.trim().toLowerCase() || []);
  const scored = jobs.map((job) => {
    const title = `${job.title} ${job.designation}`.toLowerCase();
    const reasons: string[] = [];
    let score = 0;
    if (!!profile.sector && job.industry === profile.sector) {
      score += 4;
      reasons.push("Your sector");
    }
    const roleMatch =
      job.title === ALL_DEPARTMENTS
        ? !!INDUSTRIES.find((v) => v.name === job.industry)?.roles.some((r) =>
            roles.includes(r.toLowerCase()),
          )
        : roles.some((r) => title.includes(r));
    if (roleMatch) {
      score += 3;
      reasons.push("Preferred role");
    }
    // Properties hire locally, so a nearby job in the candidate's sector
    // outranks a role match in another city.
    const near = nearness(job, profile);
    score += near.score;
    if (near.reason) reasons.unshift(near.reason);
    return { job, reasons, score, near: near.score >= 4 };
  });
  const ranked = scored.toSorted((a, b) => b.score - a.score);
  const items = ranked.slice(0, RECOMMENDED);
  return {
    matched: ranked.some((r) => r.score > 0),
    nearby: items.some((r) => r.near),
    matches: jobs.filter((job) => job.industry === profile.sector).length,
    items,
  };
}
