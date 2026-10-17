// Fills the database in .env with demo companies, jobs, candidates and
// applications at every step of the recruitment flow. Remove it all with
// `npm run demo:clean`.
import {
  DAY,
  DEMO_PREFIX,
  HOUR,
  HR_ROUND,
  JC_ROUND,
  PASSWORD,
  VENUE,
  apply as applyTo,
  at,
  check,
  clearScreening,
  closeJob,
  createCandidate,
  createCompany,
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

const { count: existing, error: existingError } = await db
  .from("companies")
  .select("id", { count: "exact", head: true })
  .like("email", `${DEMO_PREFIX}%`);
check(existingError, "Checking for demo data");
if (existing) {
  console.error("Demo data already exists. Run `npm run demo:clean` first.");
  process.exit(1);
}

// ---------------------------------------------------------------- companies

const COMPANIES = [
  {
    handle: "tajpalace",
    company_name: "Taj Palace Hotels",
    property_name: "Taj Palace, New Delhi",
    industry: "hotels",
    size: "1000+",
    website: "tajpalace-demo.in",
    city: "New Delhi",
    pincode: "110021",
    contact_name: "Ananya Mehra",
    designation: "HR Manager",
    phone: "9810012345",
  },
  {
    handle: "oberoi",
    company_name: "The Oberoi Group",
    property_name: "The Oberoi, Mumbai",
    industry: "hotels",
    size: "201-1000",
    website: "oberoi-demo.in",
    city: "Mumbai",
    pincode: "400021",
    contact_name: "Rahul Kapoor",
    designation: "Talent Acquisition Lead",
    phone: "9820012345",
  },
  {
    handle: "indigo",
    company_name: "IndiGo Airlines",
    property_name: null,
    industry: "airlines",
    size: "1000+",
    website: "indigo-demo.in",
    city: "Gurugram",
    pincode: "122002",
    contact_name: "Sneha Rao",
    designation: "Recruitment Manager",
    phone: "9811098765",
  },
  {
    handle: "socialcafe",
    company_name: "Social Cafe & Bar",
    property_name: "Social, Koramangala",
    industry: "cafes",
    size: "51-200",
    website: "socialcafe-demo.in",
    city: "Bengaluru",
    pincode: "560034",
    contact_name: "Vikram Shetty",
    designation: "Operations Head",
    phone: "9845012345",
  },
];

const companies = {};
for (const c of COMPANIES) companies[c.handle] = await createCompany(c);
console.log(`Created ${COMPANIES.length} companies`);

// ---------------------------------------------------------------- jobs

const JOBS = [
  { key: "taj-fo", company: "tajpalace", role: "Front Office / Reception", designation: "Front Office Associate", exp: [1, 3], salary: [3, 4.5], openings: 3 },
  { key: "taj-chef", company: "tajpalace", role: "Chefs & Kitchen Staff", designation: "Commis Chef", exp: [0, 2], salary: [2.4, 3.6], openings: 4 },
  { key: "taj-hk", company: "tajpalace", role: "Housekeeping Staff", designation: "Housekeeping Supervisor", exp: [3, 6], salary: [3.6, 5], openings: 1 },
  { key: "oberoi-gre", company: "oberoi", role: "Guest Relations Executives", designation: "Guest Relations Executive", exp: [1, 4], salary: [3.5, 5.5], openings: 2 },
  { key: "oberoi-fnb", company: "oberoi", role: "F&B Service Staff", designation: "F&B Steward", exp: [0, 2], salary: [2.2, 3], openings: 5 },
  { key: "indigo-cabin", company: "indigo", role: "Cabin Crew", designation: "Cabin Crew Trainee", exp: [0, 1], salary: [4, 6], openings: 20 },
  { key: "indigo-ground", company: "indigo", role: "Ground Staff", designation: "Customer Service Agent", exp: [0, 3], salary: [2.8, 3.8], openings: 10 },
  { key: "social-barista", company: "socialcafe", role: "Baristas", designation: "Barista", exp: [0, 2], salary: [2, 2.8], openings: 3 },
  { key: "social-mgr", company: "socialcafe", role: "Cafe Managers", designation: "Assistant Cafe Manager", exp: [3, 6], salary: [4.5, 6.5], openings: 1, closed: true },
];

const jobs = {};
for (const j of JOBS) jobs[j.key] = await createJob(companies[j.company], { ...j, internship: j.key === "indigo-cabin" });
console.log(`Created ${JOBS.length} jobs`);

// ---------------------------------------------------------------- candidates

const CANDIDATES = [
  { handle: "aarav", first: "Aarav", last: "Sharma", city: "New Delhi", pincode: "110017", industry: "hotels", title: "Front Desk Agent", employer: "Radisson Blu", years: 2, skills: ["Check-in / check-out", "Guest handling", "Upselling"], degree: "BHM", college: "IHM Pusa" },
  { handle: "diya", first: "Diya", last: "Patel", city: "Mumbai", pincode: "400050", industry: "hotels", title: "Guest Relations Associate", employer: "Trident", years: 3, skills: ["VIP handling", "Complaint resolution", "French"], degree: "BHM", college: "IHM Mumbai" },
  { handle: "kabir", first: "Kabir", last: "Singh", city: "New Delhi", pincode: "110024", industry: "hotels", title: "Commis Chef", employer: "The Leela", years: 1, skills: ["Continental cuisine", "Mise en place", "HACCP"], degree: "Diploma in Culinary Arts", college: "IHM Pusa" },
  { handle: "meera", first: "Meera", last: "Iyer", city: "Bengaluru", pincode: "560038", industry: "cafes", title: "Barista", employer: "Third Wave Coffee", years: 2, skills: ["Espresso", "Latte art", "Cash handling"], degree: "B.Com", college: "Christ University" },
  { handle: "rohan", first: "Rohan", last: "Verma", city: "Gurugram", pincode: "122001", industry: "airlines", title: "Customer Service Agent", employer: "Air India SATS", years: 2, skills: ["Check-in", "Baggage handling", "Announcements"], degree: "BBA Aviation", college: "Amity University" },
  { handle: "ishaan", first: "Ishaan", last: "Gupta", city: "Mumbai", pincode: "400076", industry: "hotels", title: "F&B Associate", employer: "Novotel", years: 1, skills: ["Fine dining service", "Wine basics", "POS"], degree: "BHM", college: "IHM Mumbai" },
  { handle: "ananya", first: "Ananya", last: "Reddy", city: "Hyderabad", pincode: "500032", industry: "airlines", title: "Aviation Student", employer: "", years: 0, skills: ["Grooming", "First aid", "Customer service"], degree: "Diploma in Aviation", college: "Frankfinn Institute" },
  { handle: "vivaan", first: "Vivaan", last: "Nair", city: "New Delhi", pincode: "110001", industry: "hotels", title: "Housekeeping Supervisor", employer: "Hyatt Regency", years: 5, skills: ["Room inspection", "Team rostering", "Inventory"], degree: "BHM", college: "IHM Kolkata" },
  { handle: "saanvi", first: "Saanvi", last: "Joshi", city: "Pune", pincode: "411001", industry: "hotels", title: "Front Office Executive", employer: "Marriott", years: 3, skills: ["Opera PMS", "Night audit", "Reservations"], degree: "BHM", college: "IHM Pune" },
  { handle: "arjun", first: "Arjun", last: "Menon", city: "Kochi", pincode: "682016", industry: "hotels", title: "Steward", employer: "Le Meridien", years: 1, skills: ["Banquet service", "Table setting", "Room service"], degree: "Diploma in F&B", college: "IHM Kovalam" },
  { handle: "kiara", first: "Kiara", last: "Malhotra", city: "Gurugram", pincode: "122018", industry: "airlines", title: "Cabin Crew Aspirant", employer: "", years: 0, skills: ["Grooming", "Safety drills", "Hindi & English"], degree: "B.A. Tourism", college: "Delhi University" },
  { handle: "aditya", first: "Aditya", last: "Kulkarni", city: "Mumbai", pincode: "400001", industry: "hotels", title: "Guest Service Associate", employer: "ITC Maratha", years: 2, skills: ["Concierge", "Local knowledge", "Guest handling"], degree: "BHM", college: "IHM Mumbai" },
  { handle: "nisha", first: "Nisha", last: "Bose", city: "Bengaluru", pincode: "560095", industry: "cafes", title: "Shift Lead", employer: "Starbucks", years: 4, skills: ["Rostering", "Inventory", "Barista training"], degree: "BBA", college: "Jain University" },
  { handle: "farhan", first: "Farhan", last: "Khan", city: "New Delhi", pincode: "110025", industry: "hotels", title: "Commis II", employer: "Pullman", years: 1, skills: ["Indian cuisine", "Tandoor", "Food safety"], degree: "Diploma in Culinary Arts", college: "IHM Pusa" },
  { handle: "tara", first: "Tara", last: "Fernandes", city: "Mumbai", pincode: "400050", industry: "hotels", title: "F&B Steward", employer: "Taj Lands End", years: 2, skills: ["Fine dining", "Bar service", "Upselling"], degree: "BHM", college: "IHM Goa" },
  { handle: "yash", first: "Yash", last: "Agarwal", city: "Gurugram", pincode: "122002", industry: "airlines", title: "Ground Staff", employer: "Celebi", years: 1, skills: ["Boarding", "Check-in", "Customer service"], degree: "BBA Aviation", college: "Amity University" },
];

const candidates = {};
for (const c of CANDIDATES) candidates[c.handle] = await createCandidate(c);
console.log(`Created ${CANDIDATES.length} member candidates`);

// ---------------------------------------------------------------- applications

const apply = (handle, jobKey, daysAgo) => applyTo(candidates[handle], jobs[jobKey], daysAgo);

const NOTE = {
  strong: "Confident, well-groomed and articulate. Handled the role-play guest complaint calmly. Strong fit for front-of-house.",
  chef: "Solid basics in continental prep and hygiene. Practical test went well. Needs some time on speed during rush hours.",
  airline: "Excellent communication and grooming. Meets height and medical requirements. Recommended for the trainee batch.",
  cafe: "Experienced barista with good latte art and a friendly manner. Available to join within two weeks.",
};

// 1. Waiting for JobClubb's preliminary screening.
await apply("aarav", "taj-fo", 1);
await apply("ananya", "indigo-cabin", 0.5);
await apply("arjun", "oberoi-fnb", 2);

// 2. JobClubb first-round interview booked for tomorrow.
{
  const app = await apply("saanvi", "taj-fo", 3);
  await interview(app, "jobclubb", { ...JC_ROUND, startsIn: DAY + 2 * HOUR });
}

// 3. JobClubb interview finished, result not recorded yet.
{
  const app = await apply("farhan", "taj-chef", 4);
  await interview(app, "jobclubb", { ...JC_ROUND, venue: VENUE.video, startsIn: -3 * HOUR });
}

// 4. Shortlisted by JobClubb, ready to refer.
{
  const app = await apply("kiara", "indigo-cabin", 5);
  await clearScreening(app, 1);
}
{
  const app = await apply("meera", "social-barista", 4);
  const { error } = await db
    .from("job_applications")
    .update({ stage: 1, screening_cleared_at: at(-DAY) })
    .eq("id", app.id);
  check(error, "Shortlisting meera without interview");
}

// 5. Referred to the employer, no employer interview yet.
{
  const app = await apply("aditya", "oberoi-gre", 7);
  await clearScreening(app, 3);
  await refer(app, NOTE.strong);
}
{
  const app = await apply("yash", "indigo-ground", 6);
  await clearScreening(app, 3);
  await refer(app, "");
}

// 6. Employer interview coming up.
{
  const app = await apply("kabir", "taj-chef", 9);
  await clearScreening(app, 6);
  await refer(app, NOTE.chef);
  await interview(app, "company", { startsIn: 2 * DAY, round: "Kitchen trial", interviewer: "Chef Arvind Rao", venue: { mode: "in_person", address: "Taj Palace, 2 Sardar Patel Marg, Diplomatic Enclave", landmark: "Staff entrance, Gate 3", city: "New Delhi", pincode: "110021" }, mins: 90 });
}

// 7. Cleared employer round 1, round 2 done and awaiting result.
{
  const app = await apply("tara", "oberoi-fnb", 12);
  await clearScreening(app, 9);
  await refer(app, NOTE.strong);
  const r1 = await interview(app, "company", { startsIn: -5 * DAY, ...HR_ROUND("Rahul Kapoor") });
  await outcome(r1, "next_round");
  const { error } = await db
    .from("job_interviews")
    .insert({
      application_id: app.id,
      company_id: app.company_id,
      starts_at: at(-4 * HOUR),
      duration_mins: 60,
      mode: "video",
      place: VENUE.video.place,
      interviewer: "Neha Desai, F&B Manager",
      round: "Service skills round",
      scheduled_at: at(-2 * DAY),
      reminder_sent_at: at(0),
    });
  check(error, "Scheduling tara round 2");
}

// 8. Selected; JobClubb is waiting for the employer's offer letter.
{
  const app = await apply("diya", "oberoi-gre", 14);
  await clearScreening(app, 11);
  await refer(app, NOTE.strong);
  await select(app, HR_ROUND("Rahul Kapoor"));
}

// 9. Offer received from the employer, ready for JobClubb to release.
{
  const app = await apply("rohan", "indigo-ground", 15);
  await clearScreening(app, 12);
  await refer(app, NOTE.airline);
  const id = await select(app, HR_ROUND("Sneha Rao"));
  await placement(id, { status: "offer_received", monthly_salary: 2800000, joining_date: dateIn(21), offer_received_at: at(-DAY), offer_notes: "Report to Terminal 1 HR desk at 9:00 AM with original documents." });
}

// 10. Offer released, candidate yet to pay.
{
  const app = await apply("ishaan", "oberoi-fnb", 18);
  await clearScreening(app, 15);
  await refer(app, NOTE.strong);
  const id = await select(app, HR_ROUND("Rahul Kapoor"));
  await placement(id, { status: "offer_received", monthly_salary: 2200000, joining_date: dateIn(20), offer_received_at: at(-2 * DAY), offer_notes: "Report to the staff entrance at 8:30 AM." });
  await placement(id, { status: "released", fee_amount: 2200000, offer_deadline: dateIn(10), released_at: at(-DAY) });
}

// 11. Paid; joining date ahead.
{
  const app = await apply("nisha", "social-barista", 25);
  await clearScreening(app, 22);
  await refer(app, NOTE.cafe);
  const id = await select(app, HR_ROUND("Vikram Shetty"));
  await placement(id, { status: "offer_received", monthly_salary: 2500000, joining_date: dateIn(6), offer_received_at: at(-6 * DAY), offer_notes: "Ask for Vikram at the Koramangala outlet." });
  await placement(id, { status: "released", fee_amount: 2500000, offer_deadline: dateIn(3), released_at: at(-5 * DAY) });
  await placement(id, { status: "accepted", accepted_at: at(-3 * DAY) });
}

// 12. Joined.
{
  const app = await apply("vivaan", "taj-hk", 40);
  await clearScreening(app, 37);
  await refer(app, NOTE.strong);
  const id = await select(app, HR_ROUND("Ananya Mehra"));
  await placement(id, { status: "offer_received", monthly_salary: 4000000, joining_date: dateIn(-10), offer_received_at: at(-25 * DAY), offer_notes: "Report to the housekeeping office, B1." });
  await placement(id, { status: "released", fee_amount: 4000000, offer_deadline: dateIn(-17), released_at: at(-24 * DAY) });
  await placement(id, { status: "accepted", accepted_at: at(-20 * DAY) });
  await placement(id, { status: "joined", closed_at: at(-9 * DAY) });
}

// 13. Joined, then resigned (reported by the employer).
{
  const app = await apply("aditya", "taj-fo", 90);
  await clearScreening(app, 85);
  await refer(app, NOTE.strong);
  const id = await select(app, HR_ROUND("Ananya Mehra"));
  await placement(id, { status: "offer_received", monthly_salary: 3200000, joining_date: dateIn(-60), offer_received_at: at(-70 * DAY) });
  await placement(id, { status: "released", fee_amount: 3200000, offer_deadline: dateIn(-65), released_at: at(-68 * DAY) });
  await placement(id, { status: "accepted", accepted_at: at(-66 * DAY) });
  await placement(id, { status: "joined", closed_at: at(-59 * DAY) });
  await placement(id, { left_on: dateIn(-5), left_reason: "resigned", left_notes: "Moved to Mumbai for family reasons.", left_reported_at: at(-4 * DAY) });
}

// 14. Not selected by JobClubb after its interview.
{
  const app = await apply("arjun", "taj-chef", 8);
  const id = await interview(app, "jobclubb", { ...JC_ROUND, startsIn: -5 * DAY });
  await outcome(id, "not_selected");
}

// 15. Not selected by the employer after their interview.
{
  const app = await apply("farhan", "oberoi-fnb", 16);
  await clearScreening(app, 13);
  await refer(app, NOTE.chef);
  const id = await interview(app, "company", { startsIn: -6 * DAY, ...HR_ROUND("Rahul Kapoor") });
  await outcome(id, "not_selected");
}

// 16. Applied to a job that has since closed.
await apply("nisha", "social-mgr", 10);
await closeJob(jobs["social-mgr"]);

console.log("Created applications at every step of the flow\n");
console.log(`Password for every demo login: ${PASSWORD}\n`);
console.log("Companies:");
for (const c of COMPANIES) console.log(`  ${c.company_name.padEnd(20)} ${email(`co-${c.handle}`)}`);
console.log("\nCandidates:");
for (const c of CANDIDATES) console.log(`  ${`${c.first} ${c.last}`.padEnd(20)} ${email(`cand-${c.handle}`)}`);
console.log("\nRemove everything with: npm run demo:clean");
