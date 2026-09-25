export type ResumeContact = {
  name: string;
  email: string;
  phone: string;
  city: string;
};

export type Resume = {
  headline: string;
  summary: string;
  skills: { category: string; items: string[] }[];
  experience: {
    title: string;
    company: string;
    location: string;
    start: string;
    end: string;
    bullets: string[];
  }[];
  education: { qualification: string; institution: string; year: string }[];
  certifications: string[];
  languages: string[];
};

export type SavedResume = {
  targetRole: string;
  jobDescription: string | null;
  keywords: string[];
  resume: Resume;
  originalScore: number | null;
  generatedAt: string;
};

export type AtsCheck = { label: string; passed: boolean };

export type AtsReport = {
  score: number;
  matched: string[];
  missing: string[];
  checks: AtsCheck[];
};

const strings = { type: "array", items: { type: "string" } } as const;

// OpenAI strict structured outputs: every property must be required and
// additionalProperties must be false at every level.
export const RESUME_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "summary", "skills", "experience", "education", "certifications", "languages"],
  properties: {
    headline: { type: "string" },
    summary: { type: "string" },
    skills: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "items"],
        properties: { category: { type: "string" }, items: strings },
      },
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "company", "location", "start", "end", "bullets"],
        properties: {
          title: { type: "string" },
          company: { type: "string" },
          location: { type: "string" },
          start: { type: "string" },
          end: { type: "string" },
          bullets: strings,
        },
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["qualification", "institution", "year"],
        properties: {
          qualification: { type: "string" },
          institution: { type: "string" },
          year: { type: "string" },
        },
      },
    },
    certifications: strings,
    languages: strings,
  },
} as const;

export function resumeToText(resume: Resume) {
  return [
    resume.headline,
    resume.summary,
    ...resume.skills.flatMap((s) => [s.category, ...s.items]),
    ...resume.experience.flatMap((e) => [e.title, e.company, e.location, ...e.bullets]),
    ...resume.education.flatMap((e) => [e.qualification, e.institution]),
    ...resume.certifications,
    ...resume.languages,
  ].join("\n");
}

function normalize(text: string) {
  return ` ${text.toLowerCase().replace(/[^a-z0-9+#&]+/g, " ").trim()} `;
}

export function matchKeywords(text: string, keywords: string[]) {
  const haystack = normalize(text);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const keyword of keywords) {
    const needle = normalize(keyword).trim();
    const found =
      needle &&
      [needle, `${needle}s`, `${needle}es`].some((form) => haystack.includes(` ${form} `));
    (found ? matched : missing).push(keyword);
  }
  return { matched, missing };
}

export function keywordScore(text: string, keywords: string[]) {
  if (keywords.length === 0) return 0;
  return Math.round((matchKeywords(text, keywords).matched.length / keywords.length) * 100);
}

// 70% keyword coverage, 30% structure — the two things applicant tracking
// systems actually parse for.
export function atsReport(resume: Resume, contact: ResumeContact, keywords: string[]): AtsReport {
  const { matched, missing } = matchKeywords(resumeToText(resume), keywords);
  const bullets = resume.experience.flatMap((e) => e.bullets);
  const checks: AtsCheck[] = [
    { label: "Contact details", passed: Boolean(contact.email && contact.phone) },
    { label: "Professional summary", passed: resume.summary.trim().length >= 80 },
    { label: "Work experience", passed: resume.experience.length > 0 },
    { label: "Education", passed: resume.education.length > 0 },
    { label: "Skills section", passed: resume.skills.some((s) => s.items.length > 0) },
    { label: "Results in bullets", passed: bullets.some((b) => /\d/.test(b)) },
  ];
  const coverage = keywords.length ? matched.length / keywords.length : 0;
  const structure = checks.filter((c) => c.passed).length / checks.length;
  return { score: Math.round(coverage * 70 + structure * 30), matched, missing, checks };
}
