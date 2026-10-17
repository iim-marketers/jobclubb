// Adds a full hiring pipeline to the demo Taj Palace Hotels account, so its
// company dashboard has data in every view. Run `npm run demo:seed` first;
// `npm run demo:clean` removes this too.
import {
  DAY,
  HOUR,
  HR_ROUND,
  JC_ROUND,
  PASSWORD,
  VENUE,
  apply,
  at,
  check,
  clearScreening,
  closeJob,
  createCandidate,
  createJob,
  dateIn,
  db,
  email,
  interview,
  outcome,
  placement,
  refer,
  select,
} from "./demo-helpers.mjs";

const COMPANY_LOGIN = email("co-tajpalace");

const { data: company, error: companyError } = await db
  .from("companies")
  .select("id, company_name, industry, city, pincode")
  .eq("email", COMPANY_LOGIN)
  .maybeSingle();
check(companyError, "Finding Taj Palace");
if (!company) {
  console.error("Taj Palace demo account not found. Run `npm run demo:seed` first.");
  process.exit(1);
}
const { count: done } = await db
  .from("candidates")
  .select("id", { count: "exact", head: true })
  .eq("email", email("cand-taj-riya"));
if (done) {
  console.error("Taj Palace already has the extra demo data.");
  process.exit(1);
}

// ---------------------------------------------------------------- jobs

const { data: existingJobs, error: jobsError } = await db
  .from("company_jobs")
  .select("id, slug, designation")
  .eq("company_id", company.id);
check(jobsError, "Loading Taj Palace jobs");
const jobs = Object.fromEntries(existingJobs.map((j) => [j.designation, j]));

const NEW_JOBS = [
  { role: "Banquet & Events Staff", designation: "Banquet Captain", exp: [2, 5], salary: [3.2, 4.8], openings: 2, postedDaysAgo: 30 },
  { role: "Spa & Wellness Staff", designation: "Spa Therapist", exp: [1, 4], salary: [2.8, 4.2], openings: 2, postedDaysAgo: 25 },
  { role: "Concierge", designation: "Concierge Executive", exp: [2, 5], salary: [3.5, 5], openings: 1, postedDaysAgo: 20 },
  { role: "Sales & Marketing Executives", designation: "Sales Executive", exp: [2, 6], salary: [4.5, 7], openings: 2, postedDaysAgo: 14 },
  { role: "Hotel Management Trainees", designation: "Management Trainee", exp: [0, 1], salary: [3, 3.6], openings: 6, internship: true, postedDaysAgo: 10 },
  { role: "Front Office / Reception", designation: "Night Auditor", exp: [1, 3], salary: [3, 4], openings: 1, postedDaysAgo: 45 },
];
for (const j of NEW_JOBS) jobs[j.designation] = await createJob(company, j);
console.log(`Added ${NEW_JOBS.length} jobs (Taj Palace now has ${Object.keys(jobs).length})`);

// ---------------------------------------------------------------- candidates

const DELHI = { city: "New Delhi", industry: "hotels" };
const CANDIDATES = [
  { handle: "taj-riya", first: "Riya", last: "Chopra", pincode: "110048", title: "Front Desk Executive", employer: "Hyatt Regency", years: 3, skills: ["Opera PMS", "Check-in / check-out", "Upselling"], degree: "BHM", college: "IHM Pusa" },
  { handle: "taj-manav", first: "Manav", last: "Sethi", pincode: "110019", title: "Banquet Supervisor", employer: "Shangri-La Eros", years: 4, skills: ["Banquet setup", "Event coordination", "Team handling"], degree: "BHM", college: "IHM Kolkata" },
  { handle: "taj-pooja", first: "Pooja", last: "Thakur", pincode: "110016", title: "Spa Therapist", employer: "O2 Spa", years: 3, skills: ["Swedish massage", "Ayurvedic therapies", "Client care"], degree: "Diploma in Spa Therapy", college: "Ananda Spa Institute" },
  { handle: "taj-siddharth", first: "Siddharth", last: "Rana", pincode: "110003", title: "Concierge", employer: "The Lodhi", years: 4, skills: ["Local knowledge", "Reservations", "VIP handling"], degree: "BHM", college: "IHM Pusa" },
  { handle: "taj-neha", first: "Neha", last: "Arora", pincode: "110092", title: "Sales Coordinator", employer: "Radisson", years: 3, skills: ["MICE sales", "CRM", "Client meetings"], degree: "MBA Marketing", college: "Amity University" },
  { handle: "taj-harsh", first: "Harsh", last: "Vardhan", pincode: "110085", title: "Hotel Management Graduate", employer: "", years: 0, skills: ["F&B service", "Front office basics", "Housekeeping basics"], degree: "BHM", college: "IHM Pusa" },
  { handle: "taj-zoya", first: "Zoya", last: "Mirza", pincode: "110025", title: "Front Office Associate", employer: "Holiday Inn", years: 2, skills: ["Reservations", "Guest handling", "Cashiering"], degree: "BHM", college: "IHM Lucknow" },
  { handle: "taj-karan", first: "Karan", last: "Bedi", pincode: "110057", title: "Commis I", employer: "JW Marriott", years: 3, skills: ["Continental cuisine", "Bakery basics", "HACCP"], degree: "Diploma in Culinary Arts", college: "IHM Pusa" },
  { handle: "taj-ankita", first: "Ankita", last: "Das", pincode: "110065", title: "Housekeeping Executive", employer: "Taj Vivanta", years: 5, skills: ["Room inspection", "Linen management", "Team rostering"], degree: "BHM", college: "IHM Bhubaneswar" },
  { handle: "taj-rahul", first: "Rahul", last: "Yadav", pincode: "110044", title: "Night Auditor", employer: "Lemon Tree", years: 2, skills: ["Night audit", "Cash reconciliation", "Opera PMS"], degree: "B.Com", college: "Delhi University" },
  { handle: "taj-simran", first: "Simran", last: "Kaur", pincode: "110027", title: "Guest Service Associate", employer: "Crowne Plaza", years: 2, skills: ["Guest handling", "Complaint resolution", "Punjabi"], degree: "BHM", college: "IHM Chandigarh" },
  { handle: "taj-dev", first: "Dev", last: "Malik", pincode: "110034", title: "Banquet Server", employer: "ITC Maurya", years: 2, skills: ["Banquet service", "Buffet setup", "Bar basics"], degree: "Diploma in F&B", college: "IHM Pusa" },
  { handle: "taj-priyanka", first: "Priyanka", last: "Saini", pincode: "110086", title: "Hotel Management Graduate", employer: "", years: 0, skills: ["Front office basics", "MS Excel", "Guest handling"], degree: "BHM", college: "IHM Jaipur" },
  { handle: "taj-amit", first: "Amit", last: "Tiwari", pincode: "110051", title: "Sales Executive", employer: "Le Meridien", years: 4, skills: ["Corporate sales", "Negotiation", "Rate contracts"], degree: "MBA", college: "IMI Delhi" },
  { handle: "taj-sakshi", first: "Sakshi", last: "Goel", pincode: "110052", title: "Spa Receptionist", employer: "Kaya Spa", years: 1, skills: ["Appointment booking", "Retail sales", "Client care"], degree: "B.A.", college: "Delhi University" },
  { handle: "taj-nikhil", first: "Nikhil", last: "Jain", pincode: "110007", title: "Commis II", employer: "Hyatt Andaz", years: 1, skills: ["Indian cuisine", "Mise en place", "Food safety"], degree: "Diploma in Culinary Arts", college: "IHM Pusa" },
  { handle: "taj-isha", first: "Isha", last: "Kapoor", pincode: "110021", title: "Front Office Associate", employer: "Novotel Aerocity", years: 1, skills: ["Check-in / check-out", "Phone etiquette", "Upselling"], degree: "BHM", college: "IHM Pusa" },
  { handle: "taj-varun", first: "Varun", last: "Bhalla", pincode: "110062", title: "Housekeeping Attendant", employer: "Pride Plaza", years: 3, skills: ["Room cleaning", "Turndown service", "Laundry"], degree: "Diploma in Housekeeping", college: "IHM Pusa" },
  { handle: "taj-aisha", first: "Aisha", last: "Qureshi", pincode: "110006", title: "Management Trainee Aspirant", employer: "", years: 0, skills: ["Event planning", "Communication", "MS Office"], degree: "BHM", college: "IHM Pusa" },
  { handle: "taj-gaurav", first: "Gaurav", last: "Chauhan", pincode: "110094", title: "Banquet Captain", employer: "The Ashok", years: 5, skills: ["Banquet operations", "Staff briefing", "Client coordination"], degree: "BHM", college: "IHM Pusa" },
  { handle: "taj-tanvi", first: "Tanvi", last: "Mishra", pincode: "110075", title: "Concierge Associate", employer: "Roseate House", years: 2, skills: ["Travel desk", "Reservations", "Local knowledge"], degree: "BHM", college: "IHM Pusa" },
  { handle: "taj-kunal", first: "Kunal", last: "Ahuja", pincode: "110018", title: "Front Office Supervisor", employer: "Eros Hotel", years: 4, skills: ["Shift handling", "Opera PMS", "Upselling"], degree: "BHM", college: "IHM Pusa" },
];

const cands = {};
for (const c of CANDIDATES) cands[c.handle.slice(4)] = await createCandidate({ ...DELHI, ...c });
console.log(`Added ${CANDIDATES.length} candidates`);

// ---------------------------------------------------------------- applications

const TAJ = {
  hr: "Ananya Mehra, HR Manager",
  fo: "Karan Bhatia, Front Office Manager",
  chef: "Chef Arvind Rao",
  spa: "Ritu Saxena, Spa Manager",
  banquet: "Sameer Khanna, Banquet Manager",
  sales: "Meenakshi Iyer, Director of Sales",
};
const ON_SITE = {
  mode: "in_person",
  address: "Taj Palace, 2 Sardar Patel Marg, Diplomatic Enclave",
  landmark: "Staff entrance, Gate 3",
  city: "New Delhi",
  pincode: "110021",
};
const NOTES = [
  "Polished and confident. Handled the role-play guest complaint calmly and offered sensible alternatives. Strong front-of-house fit.",
  "Good technical basics and clear about their career goals. Available to join within 30 days.",
  "Excellent grooming and communication. Prior luxury-hotel experience; would suit a high-touch guest environment.",
  "Solid experience for the level. Slightly nervous at first but answered scenario questions well.",
  "",
];
let noteNo = 0;
const nextNote = () => NOTES[noteNo++ % NOTES.length];

async function referred(name, designation, appliedDaysAgo, referredDaysAgo = 1) {
  const app = await apply(cands[name], jobs[designation], appliedDaysAgo);
  await clearScreening(app, (appliedDaysAgo + referredDaysAgo) / 2);
  await refer(app, nextNote(), referredDaysAgo);
  return app;
}

// Takes a placement through the offer steps up to `to`.
async function offer(id, to, { salary, joiningIn }) {
  const steps = ["offer_received", "released", "accepted", "joined"];
  const deadline = Math.min(joiningIn - 2, 7);
  await placement(id, {
    status: "offer_received",
    monthly_salary: salary,
    joining_date: dateIn(joiningIn),
    offer_received_at: at((Math.min(joiningIn, 0) - 12) * DAY),
    offer_notes: "Report to the HR office, Lower Ground Floor, at 9:30 AM with original documents and two photographs.",
  });
  if (to === "offer_received") return;
  await placement(id, {
    status: "released",
    fee_amount: salary,
    offer_deadline: dateIn(deadline),
    released_at: at((Math.min(joiningIn, 0) - 10) * DAY),
  });
  if (to === "expired" || to === "declined" || to === "withdrawn")
    return placement(id, { status: to, closed_at: at(-DAY) });
  if (to === "released") return;
  await placement(id, { status: "accepted", accepted_at: at((Math.min(joiningIn, 0) - 8) * DAY) });
  if (steps.indexOf(to) === 2) return;
  await placement(id, { status: to, closed_at: at((joiningIn + 1) * DAY) });
}

// New referrals, waiting for Taj to interview.
await referred("riya", "Front Office Associate", 4, 1);
await referred("manav", "Banquet Captain", 5, 0.5);
await referred("tanvi", "Concierge Executive", 3, 0.2);
await referred("aisha", "Management Trainee", 4, 1);

// Interviews coming up: today, tomorrow and later this week; one live now.
{
  const app = await referred("zoya", "Front Office Associate", 6, 3);
  await interview(app, "company", { startsIn: 3 * HOUR, round: "Manager round", interviewer: TAJ.fo, mins: 45 });
}
{
  const app = await referred("pooja", "Spa Therapist", 7, 3);
  await interview(app, "company", { startsIn: DAY + HOUR, round: "Practical assessment", interviewer: TAJ.spa, venue: ON_SITE, mins: 90 });
}
{
  const app = await referred("amit", "Sales Executive", 8, 4);
  await interview(app, "company", { startsIn: 4 * DAY, round: "Director of Sales round", interviewer: TAJ.sales, venue: ON_SITE, mins: 60 });
}
{
  const app = await referred("harsh", "Management Trainee", 6, 3);
  await interview(app, "company", { startsIn: -15 * 60_000, round: "HR round", interviewer: TAJ.hr, mins: 45 });
}

// Interviewed, result still to record.
{
  const app = await referred("siddharth", "Concierge Executive", 10, 5);
  await interview(app, "company", { startsIn: -DAY, ...HR_ROUND(TAJ.hr) });
}
{
  const app = await referred("nikhil", "Commis Chef", 9, 5);
  await interview(app, "company", { startsIn: -5 * HOUR, round: "Kitchen trial", interviewer: TAJ.chef, venue: ON_SITE, mins: 90 });
}

// Cleared round 1; round 2 not booked yet, and one with round 2 booked.
{
  const app = await referred("sakshi", "Spa Therapist", 12, 7);
  const r1 = await interview(app, "company", { startsIn: -3 * DAY, ...HR_ROUND(TAJ.hr) });
  await outcome(r1, "next_round");
}
{
  const app = await referred("kunal", "Front Office Associate", 14, 9);
  const r1 = await interview(app, "company", { startsIn: -4 * DAY, ...HR_ROUND(TAJ.hr) });
  await outcome(r1, "next_round");
  await interview(app, "company", { startsIn: 2 * DAY + 3 * HOUR, round: "GM round", interviewer: "Rajiv Menon, General Manager", venue: ON_SITE, mins: 30 });
}

// Selected: offer letter to upload, with JobClubb, with the candidate.
{
  const app = await referred("gaurav", "Banquet Captain", 15, 10);
  await select(app, HR_ROUND(TAJ.banquet), 4);
}
{
  const app = await referred("karan", "Commis Chef", 16, 10);
  await select(app, { round: "Kitchen trial", interviewer: TAJ.chef, venue: ON_SITE, mins: 90 }, 1);
}
{
  const app = await referred("ankita", "Housekeeping Supervisor", 18, 12);
  const id = await select(app, HR_ROUND(TAJ.hr), 6);
  await offer(id, "offer_received", { salary: 4200000, joiningIn: 20 });
}
{
  const app = await referred("simran", "Concierge Executive", 20, 14);
  const id = await select(app, HR_ROUND(TAJ.hr), 8);
  await offer(id, "released", { salary: 3800000, joiningIn: 15 });
}

// Confirmed: joining ahead, and joining date passed (Taj must record it).
{
  const app = await referred("dev", "Banquet Captain", 25, 18);
  const id = await select(app, HR_ROUND(TAJ.banquet), 12);
  await offer(id, "accepted", { salary: 3000000, joiningIn: 9 });
}
{
  const app = await referred("rahul", "Night Auditor", 35, 28);
  const id = await select(app, HR_ROUND(TAJ.fo), 20);
  await offer(id, "accepted", { salary: 3300000, joiningIn: -1 });
}

// Joined, joined then terminated, and did not join.
{
  const app = await referred("varun", "Housekeeping Supervisor", 60, 50);
  const id = await select(app, HR_ROUND(TAJ.hr), 40);
  await offer(id, "joined", { salary: 2600000, joiningIn: -21 });
}
{
  const app = await referred("isha", "Front Office Associate", 50, 42);
  const id = await select(app, HR_ROUND(TAJ.fo), 35);
  await offer(id, "joined", { salary: 3100000, joiningIn: -14 });
}
{
  const app = await referred("priyanka", "Night Auditor", 120, 110);
  const id = await select(app, HR_ROUND(TAJ.fo), 100);
  await offer(id, "joined", { salary: 2900000, joiningIn: -80 });
  await placement(id, {
    left_on: dateIn(-12),
    left_reason: "terminated",
    left_notes: "Repeated unexplained absence from night shifts after two written warnings.",
    left_reported_at: at(-11 * DAY),
  });
}
{
  const app = await referred("neha", "Sales Executive", 40, 33);
  const id = await select(app, HR_ROUND(TAJ.sales), 28);
  await offer(id, "not_joined", { salary: 5200000, joiningIn: -6 });
}

// Offers that fell through: declined, lapsed, withdrawn by Taj.
{
  const app = await referred("tanvi", "Front Office Associate", 30, 24);
  const id = await select(app, HR_ROUND(TAJ.fo), 18);
  await offer(id, "declined", { salary: 3200000, joiningIn: 10 });
}
{
  const app = await referred("manav", "Night Auditor", 32, 26);
  const id = await select(app, HR_ROUND(TAJ.fo), 20);
  await offer(id, "expired", { salary: 3400000, joiningIn: 12 });
  await placement(id, { offer_deadline: dateIn(-2) });
}
{
  const app = await referred("amit", "Concierge Executive", 28, 22);
  const id = await select(app, HR_ROUND(TAJ.hr), 15);
  await offer(id, "withdrawn", { salary: 4000000, joiningIn: 18 });
}

// Not selected: after Taj's interview, and straight from the referral.
{
  const app = await referred("zoya", "Concierge Executive", 22, 15);
  const id = await interview(app, "company", { startsIn: -10 * DAY, ...HR_ROUND(TAJ.hr) });
  await outcome(id, "not_selected");
}
{
  const app = await referred("sakshi", "Front Office Associate", 26, 20);
  const r1 = await interview(app, "company", { startsIn: -15 * DAY, ...HR_ROUND(TAJ.hr) });
  await outcome(r1, "next_round");
  const r2 = await interview(app, "company", { startsIn: -12 * DAY, round: "Manager round", interviewer: TAJ.fo, mins: 45 });
  await outcome(r2, "not_selected");
}
{
  const app = await referred("nikhil", "Banquet Captain", 11, 6);
  const { error } = await db
    .from("job_applications")
    .update({ status: "rejected", rejected_at: at(-4 * DAY) })
    .eq("id", app.id);
  check(error, "Rejecting nikhil");
}

// Still with JobClubb: Taj can't see these, the admin Applications page can.
await apply(cands.kunal, jobs["Concierge Executive"], 1);
{
  const app = await apply(cands.harsh, jobs["Banquet Captain"], 2);
  await interview(app, "jobclubb", { ...JC_ROUND, startsIn: DAY });
}
{
  const app = await apply(cands.aisha, jobs["Spa Therapist"], 3);
  const id = await interview(app, "jobclubb", { ...JC_ROUND, venue: VENUE.video, startsIn: -DAY });
  await outcome(id, "next_round");
}

// The night-auditor role has been filled, so the posting is closed.
await closeJob(jobs["Night Auditor"]);

console.log("Added the Taj Palace pipeline\n");
console.log("Company login");
console.log(`  Email:    ${COMPANY_LOGIN}`);
console.log(`  Password: ${PASSWORD}`);
