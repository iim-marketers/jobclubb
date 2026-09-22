export type Job = {
  role: string;
  company: string;
  location: string;
  type: string;
  category: string;
  salary: string;
  postedAgo: string;
  featured?: boolean;
};

const AVATAR_COLORS = [
  "#c1442e",
  "#5a3d8a",
  "#1b64d8",
  "#0a7d55",
  "#0b2f6b",
  "#8a5a2b",
  "#b0203a",
  "#12756b",
] as const;

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export const FRESH_JOBS = [
  { role: "Cabin Crew", company: "IndiGo", location: "Kolkata", salary: "₹6L" },
  { role: "Front Office Executive", company: "Taj Hotels", location: "Mumbai", salary: "₹5L" },
  { role: "Reservation Agent", company: "MakeMyTrip", location: "Gurugram", salary: "₹5L" },
];

export const HERO_STATS = [
  { icon: "shield", value: "Secure", label: "Data protected & private" },
  { icon: "check", value: "Verified", label: "Employers & job posts" },
  { icon: "chart", value: "5 Lakh+", label: "Live job openings" },
  { icon: "users", value: "15,100+", label: "Candidates placed" },
  { icon: "star", value: "3", label: "Guaranteed interviews" },
] as const;

// Logos in /public/recruiters share a 260×215 canvas. a4/a8 use their
// "-alt" variants, which sit on white like the rest.
export const RECRUITER_LOGOS = [
  "a1.png",
  "a2.png",
  "a3.png",
  "a4-alt.png",
  "a5.png",
  "a6.png",
  "a7.png",
  "a8-alt.png",
  "a9.png",
  "a10.png",
  "b1.png",
  "b2.png",
  "b3.png",
  "b4.png",
  "b5.png",
  "b6.png",
  "b7.png",
  "b8.png",
  "b9.png",
  "b10.png",
  "c1.png",
  "c2.png",
  "c3.png",
  "c4.png",
  "c5.png",
  "c6.png",
  "c7.png",
  "c8.png",
  "c9.png",
  "c10.png",
  "d1.png",
  "d2.png",
  "d3.png",
  "d4.png",
  "d5.png",
  "d6.png",
  "d7.png",
  "d8.png",
  "d9.png",
  "d10.png",
  "e1.png",
  "e2.png",
  "e3.png",
  "e4.png",
  "e5.png",
  "e6.png",
  "e7.png",
  "el2.webp",
  "el4.webp",
  "logo8.png",
  "logo9.webp",
  "logo10.png",
  "logo11.webp",
  "logo15.png",
].map((file) => `/recruiters/${file}`);

export const EMPLOYERS = [
  "Emirates",
  "Qatar Airways",
  "Singapore Airlines",
  "Etihad",
  "Air India",
  "IndiGo",
  "Gulf Air",
  "The Oberoi",
  "Taj Hotels",
  "J.W. Marriott",
  "The Ritz-Carlton",
  "Hyatt",
  "ITC Welcomgroup",
  "Four Seasons",
  "Hilton Group",
  "Accor Hotels",
  "Dream Cruises",
  "Star Cruises",
  "MakeMyTrip",
  "Yatra.com",
  "EaseMyTrip",
  "Cleartrip",
];

export const JOB_FILTERS = [
  "All",
  "Airlines",
  "Hotels",
  "Restaurants",
  "Cafes",
  "Bars & Nightclubs",
  "Cruise Lines",
  "Travel & Tourism",
];

export const FEATURED_JOBS: Job[] = [
  { role: "Cabin Crew", company: "IndiGo", location: "Kolkata", type: "full time", category: "Airlines", salary: "₹4.5 LPA – 6 LPA", postedAgo: "2 days ago", featured: true },
  { role: "Front Office Executive", company: "Taj Hotels", location: "Mumbai", type: "full time", category: "Hotels", salary: "₹3 LPA – 4.5 LPA", postedAgo: "3 days ago", featured: true },
  { role: "Ground Staff", company: "Air India", location: "Bengaluru", type: "full time", category: "Airlines", salary: "₹3 LPA – 4.2 LPA", postedAgo: "4 days ago", featured: true },
  { role: "F&B Service Staff", company: "J.W. Marriott", location: "Pune", type: "full time", category: "Hotels", salary: "₹2.8 LPA – 3.9 LPA", postedAgo: "5 days ago", featured: true },
  { role: "Reservation Agent", company: "MakeMyTrip", location: "Gurugram", type: "full time", category: "Travel & Tourism", salary: "₹3.5 LPA – 5.2 LPA", postedAgo: "6 days ago" },
  { role: "Cruise Staff", company: "Dream Cruises", location: "Mumbai", type: "full time", category: "Cruise Lines", salary: "₹5 LPA – 7 LPA", postedAgo: "1 week ago" },
];

export const HOW_IT_WORKS = [
  { step: "01", title: "Join JobClubb", body: "Create your account, verify your email and activate your membership. Add your skills and preferences to get matched with the best opportunities." },
  { step: "02", title: "Browse jobs & set interviews", body: "Search roles that suit your skills. Members enjoy guaranteed interviews with hiring employers, plus recommendations tuned to your profile." },
  { step: "03", title: "Upskill & prepare", body: "Boost your resume and interview performance with our upskilling programs - from interview coaching to certification courses." },
  { step: "04", title: "Get your dream job", body: "Walk in ready to nail the interview and land the role. We support you every step, from application to onboarding." },
];

export const MEMBERSHIP_POINTS = [
  "Exclusive access to top employers.",
  "Guaranteed interviews with hiring employers.",
  "Upskill with us.",
  "Get hired faster.",
];

export const MEMBERSHIP_FEATURES = [
  "Unlock all live jobs",
  "Unlimited one-click apply",
  "Guaranteed employer interviews",
  "Full upskilling & certification access",
  "Priority support till you're hired",
];

export const CATEGORIES = [
  { name: "Airlines", count: 14 },
  { name: "Hotels", count: 11 },
  { name: "Restaurants", count: 6 },
  { name: "Cafes", count: 5 },
  { name: "Bars & Nightclubs", count: 6 },
  { name: "Cruise Lines", count: 7 },
  { name: "Travel & Tourism", count: 10 },
];

export const FRANCHISE_STEPS = [
  { step: "01", title: "Apply & partner up", body: "Complete the application and, once approved, secure the rights to your territory." },
  { step: "02", title: "Get trained", body: "No recruitment experience needed - we train you across operations, marketing and best practice." },
  { step: "03", title: "Launch your business", body: "Go live with ready-made marketing tools and a full platform to attract seekers and employers." },
  { step: "04", title: "Grow with support", body: "Earn from placements, memberships and upskilling - with lifelong mentoring behind you." },
];

export const ABOUT_STATS = [
  { value: "15,100+", label: "members placed across 14+ companies" },
  { value: "5 Lakh+", label: "Live jobs" },
  { value: "100%", label: "Verified employers" },
  { value: "3", label: "Interviews" },
];
