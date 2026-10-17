// Shared by the demo seed scripts. Every demo login is a Resend test address
// (delivered+jcdemo-…@resend.dev), so emails the app sends them go nowhere,
// and `npm run demo:clean` finds them by that prefix.
import { randomInt } from "node:crypto";
import { existsSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

if (existsSync(".env")) process.loadEnvFile(".env");

export const DEMO_PREFIX = "delivered+jcdemo-";
export const PASSWORD = "JobClubbDemo#2026";
const TERMS_VERSION = "2026.10.1";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.");
  process.exit(1);
}
export const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

export const email = (handle) => `${DEMO_PREFIX}${handle}@resend.dev`;
export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
export const at = (ms) => new Date(Date.now() + ms).toISOString();
export const dateIn = (days) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(Date.now() + days * DAY));

export function check(error, what) {
  if (error) {
    console.error(`${what} failed:`, error.message ?? error);
    process.exit(1);
  }
}

async function createUser(handle, metadata) {
  const { data, error } = await db.auth.admin.createUser({
    email: email(handle),
    password: PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
  });
  check(error, `Creating ${handle}`);
  return data.user.id;
}

export async function createCompany(c) {
  const { handle, ...meta } = c;
  const id = await createUser(`co-${handle}`, {
    role: "company",
    ...meta,
    sector: meta.industry,
    terms_version: TERMS_VERSION,
  });
  const { error } = await db
    .from("companies")
    .update({ status: "verified", email_verified_at: at(-20 * DAY) })
    .eq("id", id);
  check(error, `Verifying ${handle}`);
  return { id, ...c };
}

const description = (role, company) =>
  `<p>${company} is hiring a ${role} to join a busy, guest-first team. You will work closely with experienced colleagues, follow brand standards and help every guest leave happy.</p><p>This is a demo listing created to preview JobClubb.</p>`;

export async function createJob(company, j) {
  const slug = `${j.designation.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${randomInt(1e5, 1e6).toString(36)}`;
  const { data, error } = await db
    .from("company_jobs")
    .insert({
      company_id: company.id,
      slug,
      industry: company.industry,
      role: j.role,
      designation: j.designation,
      city: company.city,
      pincode: company.pincode,
      job_type: j.internship ? "Internship" : "Full time",
      work_mode: "Onsite",
      experience_min: j.exp[0],
      experience_max: j.exp[1],
      salary_min_lpa: j.salary[0],
      salary_max_lpa: j.salary[1],
      openings: j.openings,
      description: description(j.designation, company.company_name),
      responsibilities: ["Deliver warm, efficient service to every guest", "Follow brand and hygiene standards", "Coordinate with other departments during shifts"],
      requirements: ["Good spoken English and Hindi", "Willing to work rotational shifts", `${j.exp[0]}+ years in a similar role`],
      benefits: ["Meals on duty", "Uniform provided", "Medical insurance"],
      status: "live",
    })
    .select("id, slug")
    .single();
  check(error, `Creating job ${j.designation}`);
  if (j.postedDaysAgo) {
    const { error: dateError } = await db
      .from("company_jobs")
      .update({ created_at: at(-j.postedDaysAgo * DAY) })
      .eq("id", data.id);
    check(dateError, "Backdating job");
  }
  return { ...data, ...j };
}

export async function closeJob(job) {
  const { error } = await db.from("company_jobs").update({ status: "closed" }).eq("id", job.id);
  check(error, `Closing ${job.designation}`);
}

const resume = (c) => ({
  headline: `${c.title} · ${c.years ? `${c.years} years` : "Fresher"} in hospitality`,
  summary: `Hospitality professional with a focus on guest experience, teamwork and consistent service standards. Comfortable in fast-paced ${c.industry === "airlines" ? "airport and in-flight" : "hotel and restaurant"} environments.`,
  skills: [
    { category: "Service", items: c.skills },
    { category: "Tools", items: ["MS Office", c.industry === "airlines" ? "Navitaire" : "Opera PMS"] },
  ],
  experience: c.years
    ? [
        {
          title: c.title,
          company: c.employer,
          location: c.city,
          start: `Jan ${2026 - c.years}`,
          end: "Present",
          bullets: ["Handled a high volume of guests every shift", "Trained new joiners on service standards", "Consistently rated well in guest feedback"],
        },
      ]
    : [],
  education: [{ qualification: c.degree, institution: c.college, year: String(2026 - c.years - 1) }],
  certifications: c.years > 2 ? ["Food Safety Level 2"] : [],
  languages: ["English", "Hindi"],
});

export async function createCandidate(c) {
  const id = await createUser(`cand-${c.handle}`, {
    role: "candidate",
    first_name: c.first,
    last_name: c.last,
    phone: `98${String(randomInt(1e7, 1e8))}`,
    city: c.city,
    pincode: c.pincode,
    industry: c.industry,
    vertical: c.industry,
    source: "Demo data",
    code: "",
    terms_version: TERMS_VERSION,
  });
  const r = resume(c);
  const updates = await Promise.all([
    db
      .from("candidates")
      .update({
        email_verified_at: at(-15 * DAY),
        membership_plan: "member",
        membership_paid_at: at(-14 * DAY),
        membership_expires_at: at(351 * DAY),
      })
      .eq("id", id),
    db.from("candidate_resumes").insert({
      candidate_id: id,
      target_role: c.title,
      keywords: c.skills,
      resume: r,
      original_score: 60 + randomInt(30),
    }),
  ]);
  for (const { error } of updates) check(error, `Setting up ${c.handle}`);
  return { id, resume: r, ...c };
}

const REF_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const newRef = () =>
  "JC-" + Array.from({ length: 6 }, () => REF_ALPHABET[randomInt(REF_ALPHABET.length)]).join("");

export async function apply(c, job, daysAgo) {
  const { data, error } = await db
    .from("job_applications")
    .insert({
      ref: newRef(),
      job_id: job.id,
      candidate_id: c.id,
      city: c.city,
      experience_months: c.years * 12,
      skills: c.skills,
      resume: c.resume,
      masked_resume: c.resume,
    })
    .select("id, ref, company_id")
    .single();
  check(error, `Applying ${c.handle} to ${job.designation}`);
  const { error: dateError } = await db
    .from("job_applications")
    .update({ created_at: at(-daysAgo * DAY) })
    .eq("id", data.id);
  check(dateError, "Backdating application");
  return { ...data, handle: c.handle };
}

export const VENUE = {
  jobclubb: { mode: "in_person", address: "JobClubb Hiring Centre, 4th Floor, Ambience Tower", landmark: "Opposite Saket Metro", city: "New Delhi", pincode: "110017" },
  video: { mode: "video", place: "https://meet.google.com/abc-defg-hij" },
};

export async function interview(app, host, { startsIn, round, interviewer, venue = VENUE.video, mins = 30 }) {
  const place =
    venue.mode === "in_person"
      ? { place: null, address: venue.address, landmark: venue.landmark, city: venue.city, pincode: venue.pincode }
      : { place: venue.place, address: null, landmark: null, city: null, pincode: null };
  const { data, error } = await db
    .from("job_interviews")
    .insert({
      application_id: app.id,
      company_id: app.company_id,
      host,
      round_no: host === "jobclubb" ? 0 : 1,
      starts_at: at(startsIn),
      duration_mins: mins,
      mode: venue.mode,
      ...place,
      interviewer,
      round,
      scheduled_at: at(Math.min(startsIn, 0) - 2 * DAY),
      // Keeps the reminder job from emailing demo interviews.
      reminder_sent_at: at(0),
    })
    .select("id")
    .single();
  check(error, `Scheduling ${host} interview for ${app.handle}`);
  return data.id;
}

export async function outcome(interviewId, value) {
  const { error } = await db
    .from("job_interviews")
    .update({ outcome: value, outcome_at: at(-HOUR) })
    .eq("id", interviewId);
  check(error, `Recording ${value}`);
}

export const JC_ROUND = { round: "JobClubb first round", interviewer: "Priya Nanda, JobClubb Talent Team", venue: VENUE.jobclubb };
export const HR_ROUND = (interviewer) => ({ round: "HR round", interviewer, mins: 45 });

export async function clearScreening(app, daysAgo) {
  const id = await interview(app, "jobclubb", { ...JC_ROUND, startsIn: -daysAgo * DAY });
  await outcome(id, "next_round");
}

export async function refer(app, note, daysAgo = 2) {
  const { error } = await db
    .from("job_applications")
    .update({ stage: 2, shortlisted_at: at(-daysAgo * DAY), referral_note: note })
    .eq("id", app.id);
  check(error, `Referring ${app.handle}`);
}

export async function select(app, employerRound, daysAgo = 3) {
  const id = await interview(app, "company", { startsIn: -daysAgo * DAY, ...employerRound });
  await outcome(id, "selected");
  const { data, error } = await db.from("placements").select("id").eq("application_id", app.id).single();
  check(error, `Finding placement for ${app.handle}`);
  return data.id;
}

export async function placement(id, update) {
  const { error } = await db.from("placements").update(update).eq("id", id);
  check(error, "Updating placement");
}
