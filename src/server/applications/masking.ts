import "server-only";

import type { Resume } from "@/lib/resume";

export type CandidateIdentity = {
  firstName: string;
  lastName: string;
};

export const HIDDEN = {
  name: "[name hidden]",
  email: "[email hidden]",
  phone: "[phone hidden]",
  profile: "[profile link hidden]",
} as const;

const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+/gu;
const PHONE = /[+(]?\d[\d\s().-]{8,}\d/g;
// A LinkedIn slug is usually the person's name, so the whole link goes.
const LINKEDIN = /(?:https?:\/\/)?(?:[\w-]+\.)?linkedin\.com\/in\/[^\s,;)]*[^\s,;).]/gi;

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function namePattern({ firstName, lastName }: CandidateIdentity) {
  const tokens = [
    ...new Set(
      `${firstName} ${lastName}`
        .split(/[^\p{L}'-]+/u)
        .map((t) => t.replace(/^['-]+|['-]+$/g, ""))
        .filter((t) => t.length >= 2),
    ),
  ].sort((a, b) => b.length - a.length);
  if (tokens.length === 0) return null;
  // \b only knows ASCII, so letter boundaries are spelled out for Unicode names.
  return new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${tokens.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}])`,
    "giu",
  );
}

const REPEATED_NAME = new RegExp(
  `${escapeRegExp(HIDDEN.name)}(?:\\s+${escapeRegExp(HIDDEN.name)})+`,
  "g",
);

function mapStrings<T>(value: T, fn: (s: string) => string): T {
  if (typeof value === "string") return fn(value) as T;
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn)) as T;
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, mapStrings(v, fn)]),
    ) as T;
  return value;
}

export function maskResume(
  resume: Resume,
  identity: CandidateIdentity,
  { revealName }: { revealName: boolean },
): Resume {
  const names = revealName ? null : namePattern(identity);
  return mapStrings(resume, (text) => {
    let out = text
      .replace(LINKEDIN, HIDDEN.profile)
      .replace(EMAIL, HIDDEN.email)
      .replace(PHONE, (match) => {
        const digits = match.replace(/\D/g, "").length;
        return digits >= 10 && digits <= 13 ? HIDDEN.phone : match;
      });
    if (names) out = out.replace(names, HIDDEN.name).replace(REPEATED_NAME, HIDDEN.name);
    return out;
  });
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const ONGOING = /present|current|now|till date|to date|ongoing/i;

function monthIndex(text: string, now: Date): number | null {
  const t = text.trim().toLowerCase();
  if (!t || ONGOING.test(t)) return now.getFullYear() * 12 + now.getMonth();
  const numeric = t.match(/\b(0?[1-9]|1[0-2])\s*[/.-]\s*((?:19|20)\d{2})\b/);
  if (numeric) return Number(numeric[2]) * 12 + Number(numeric[1]) - 1;
  const year = t.match(/\b(?:19|20)\d{2}\b/);
  if (!year) return null;
  const month = MONTHS.findIndex((m) => t.includes(m));
  return Number(year[0]) * 12 + Math.max(month, 0);
}

export function experienceMonths(resume: Resume, now = new Date()) {
  const spans = resume.experience
    .map((job) => [monthIndex(job.start, now), monthIndex(job.end, now)] as const)
    .filter((s): s is readonly [number, number] => s[0] !== null && s[1] !== null && s[1] >= s[0])
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let current: [number, number] | null = null;
  for (const [start, end] of spans) {
    if (current && start <= current[1]) current[1] = Math.max(current[1], end);
    else {
      if (current) total += current[1] - current[0];
      current = [start, end];
    }
  }
  if (current) total += current[1] - current[0];
  return Math.min(total, 720);
}

export function resumeSkills(resume: Resume) {
  const seen = new Set<string>();
  return resume.skills
    .flatMap((g) => g.items)
    .map((s) => s.trim())
    .filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()));
}
