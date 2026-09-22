export type JobListing = {
  // Role + id only: the URL is visible to non-members, so no company or city.
  slug: string;
  title: string;
  designation: string;
  company: string;
  vertical: string;
  location: string;
  pincode: string;
  salaryRange: string;
  experience: string;
  jobType: "Full time" | "Internship";
  workMode: "WFO" | "WFH" | "Hybrid" | "Field" | "Onsite";
  postedAgo: string;
  featured?: boolean;
  // Gated behind membership (SOP §3.3).
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
};

export const JOBS: JobListing[] = [
  {
    slug: "cabin-crew-1001",
    title: "Cabin Crew",
    designation: "Cabin Crew Member",
    company: "IndiGo",
    vertical: "Airlines",
    location: "Kolkata, WB",
    pincode: "700052",
    salaryRange: "₹4.5 LPA – 6 LPA",
    experience: "0 – 2 years",
    jobType: "Full time",
    workMode: "Field",
    postedAgo: "2 days ago",
    featured: true,
    description:
      "Join IndiGo's cabin crew and deliver a safe, warm and consistent onboard experience across our domestic and international network.",
    responsibilities: [
      "Conduct pre-flight safety and equipment checks",
      "Deliver in-flight service to company standards",
      "Manage passenger queries and in-flight incidents calmly",
      "Complete post-flight reporting accurately",
    ],
    requirements: [
      "Minimum 10+2; graduates preferred",
      "Height 155cm+, medically fit per DGCA norms",
      "Fluent in English and Hindi",
      "Willing to relocate to any base",
    ],
    benefits: ["Layover allowance", "Staff travel concessions", "Medical cover", "Uniform provided"],
  },
  {
    slug: "front-office-executive-1002",
    title: "Front Office / Reception",
    designation: "Front Office Executive",
    company: "Taj",
    vertical: "Hotels",
    location: "Mumbai, MH",
    pincode: "400001",
    salaryRange: "₹3 LPA – 4.5 LPA",
    experience: "1 – 3 years",
    jobType: "Full time",
    workMode: "Onsite",
    postedAgo: "3 days ago",
    featured: true,
    description:
      "Be the first point of contact at a flagship Taj property, owning check-in, check-out and guest satisfaction at the front desk.",
    responsibilities: [
      "Manage guest check-in and check-out",
      "Handle reservations and room allocation",
      "Resolve guest complaints and escalate where needed",
      "Coordinate with housekeeping and concierge",
    ],
    requirements: [
      "Degree or diploma in Hotel Management",
      "Prior front office experience in a 5-star property",
      "Strong spoken English and guest etiquette",
      "Comfortable with rotational shifts",
    ],
    benefits: ["Duty meals", "Accommodation support", "Performance incentives", "Career progression"],
  },
  {
    slug: "ground-staff-1003",
    title: "Ground Staff",
    designation: "Airport Ground Services Executive",
    company: "Air India",
    vertical: "Airlines",
    location: "Bengaluru, KA",
    pincode: "560300",
    salaryRange: "₹3 LPA – 4.2 LPA",
    experience: "0 – 2 years",
    jobType: "Full time",
    workMode: "Onsite",
    postedAgo: "4 days ago",
    featured: true,
    description:
      "Support airport operations across check-in, boarding and passenger assistance at Kempegowda International Airport.",
    responsibilities: [
      "Handle passenger check-in and baggage acceptance",
      "Assist at boarding gates and arrivals",
      "Support special-assistance passengers",
      "Maintain on-time departure standards",
    ],
    requirements: [
      "Minimum 10+2",
      "Good communication in English and Kannada or Hindi",
      "Willing to work rotational shifts",
      "Clean background verification",
    ],
    benefits: ["Shift allowance", "Staff travel benefits", "Medical cover", "Training provided"],
  },
  {
    slug: "fb-service-staff-1004",
    title: "F&B Service Staff",
    designation: "F&B Service Associate",
    company: "J.W. Marriott",
    vertical: "Hotels",
    location: "Pune, MH",
    pincode: "411001",
    salaryRange: "₹2.8 LPA – 3.9 LPA",
    experience: "0 – 3 years",
    jobType: "Full time",
    workMode: "Onsite",
    postedAgo: "5 days ago",
    featured: true,
    description:
      "Deliver attentive food and beverage service across restaurants, in-room dining and banquets at J.W. Marriott Pune.",
    responsibilities: [
      "Take orders and serve guests to brand standards",
      "Set up and clear covers efficiently",
      "Upsell menu items and specials",
      "Maintain hygiene and HACCP compliance",
    ],
    requirements: [
      "Diploma in Hotel Management preferred",
      "Presentable with good spoken English",
      "Able to stand for long shifts",
      "Team-oriented attitude",
    ],
    benefits: ["Duty meals", "Tips and service charge", "Uniform and laundry", "Skill training"],
  },
  {
    slug: "reservation-agent-1005",
    title: "Reservation Agents",
    designation: "Reservation Executive",
    company: "MakeMyTrip",
    vertical: "Travel & Tourism",
    location: "Gurugram, HR",
    pincode: "122002",
    salaryRange: "₹3.5 LPA – 5.2 LPA",
    experience: "1 – 4 years",
    jobType: "Full time",
    workMode: "Hybrid",
    postedAgo: "6 days ago",
    description:
      "Handle flight and hotel reservations for customers across voice and chat, ensuring accurate bookings and high CSAT.",
    responsibilities: [
      "Process flight, hotel and holiday bookings",
      "Handle modifications, cancellations and refunds",
      "Meet conversion and CSAT targets",
      "Maintain accurate booking records in the GDS",
    ],
    requirements: [
      "Graduate in any discipline",
      "GDS exposure (Amadeus/Galileo) is an advantage",
      "Excellent written and spoken English",
      "Comfortable with rotational shifts",
    ],
    benefits: ["Hybrid working", "Quarterly incentives", "Travel discounts", "Insurance"],
  },
  {
    slug: "cruise-staff-1006",
    title: "Cruise Staff",
    designation: "Guest Experience Crew",
    company: "Dream Cruises",
    vertical: "Cruise Lines",
    location: "Mumbai, MH",
    pincode: "400005",
    salaryRange: "₹5 LPA – 7 LPA",
    experience: "1 – 3 years",
    jobType: "Full time",
    workMode: "Onsite",
    postedAgo: "1 week ago",
    description:
      "Join a cruise contract delivering guest activities, entertainment support and onboard hospitality across Asian itineraries.",
    responsibilities: [
      "Host onboard activities and guest programmes",
      "Support embarkation and disembarkation",
      "Assist guests with onboard queries",
      "Comply with maritime safety drills",
    ],
    requirements: [
      "Valid passport with 18+ months validity",
      "Ability to pass a seafarer medical",
      "Fluent English",
      "Willing to work 6–8 month contracts at sea",
    ],
    benefits: ["Accommodation and meals onboard", "Tax-efficient earnings", "Global travel", "Contract bonus"],
  },
  {
    slug: "barista-cafe-supervisor-1007",
    title: "Baristas",
    designation: "Barista",
    company: "Taj",
    vertical: "Cafes",
    location: "New Delhi, DL",
    pincode: "110003",
    salaryRange: "₹2.4 LPA – 3.2 LPA",
    experience: "0 – 2 years",
    jobType: "Full time",
    workMode: "Onsite",
    postedAgo: "1 week ago",
    description:
      "Craft speciality coffee and deliver a warm counter experience at a premium lobby cafe.",
    responsibilities: [
      "Prepare espresso-based and speciality beverages",
      "Maintain equipment and bar hygiene",
      "Handle billing and counter service",
      "Manage stock and wastage",
    ],
    requirements: [
      "Minimum 10+2",
      "Barista certification preferred",
      "Good spoken English",
      "Flexible with shifts",
    ],
    benefits: ["Duty meals", "Barista training", "Uniform", "Tips"],
  },
  {
    slug: "bartender-1008",
    title: "Bartenders",
    designation: "Bartender",
    company: "The Park Hotel",
    vertical: "Bars & Nightclubs",
    location: "Kolkata, WB",
    pincode: "700016",
    salaryRange: "₹2.6 LPA – 3.8 LPA",
    experience: "1 – 4 years",
    jobType: "Full time",
    workMode: "Onsite",
    postedAgo: "9 days ago",
    description:
      "Run the bar at one of Kolkata's best-known nightlife venues, mixing classics and signature cocktails.",
    responsibilities: [
      "Prepare cocktails and serve beverages",
      "Manage bar stock and inventory",
      "Engage guests and drive upselling",
      "Ensure responsible service of alcohol",
    ],
    requirements: [
      "2+ years behind a bar",
      "Knowledge of classic and contemporary cocktails",
      "Comfortable with late shifts",
      "Strong guest interaction skills",
    ],
    benefits: ["Tips and incentives", "Duty meals", "Mixology training", "Staff discounts"],
  },
  {
    slug: "holiday-package-consultant-1009",
    title: "Holiday Package Consultants",
    designation: "Holiday Consultant",
    company: "Yatra.com",
    vertical: "Travel & Tourism",
    location: "Noida, UP",
    pincode: "201301",
    salaryRange: "₹3.2 LPA – 5 LPA",
    experience: "1 – 3 years",
    jobType: "Full time",
    workMode: "WFO",
    postedAgo: "10 days ago",
    description:
      "Design and sell holiday packages for domestic and international leisure travellers.",
    responsibilities: [
      "Build customised itineraries",
      "Convert enquiries into confirmed bookings",
      "Coordinate with suppliers and DMCs",
      "Handle post-booking service",
    ],
    requirements: [
      "Graduate, preferably in Travel & Tourism",
      "Destination knowledge",
      "Sales orientation with target focus",
      "Good written English",
    ],
    benefits: ["Sales incentives", "FAM trips", "Insurance", "Travel discounts"],
  },
  {
    slug: "housekeeping-supervisor-1010",
    title: "Housekeeping Staff",
    designation: "Housekeeping Supervisor",
    company: "Hilton Group",
    vertical: "Hotels",
    location: "Hyderabad, TS",
    pincode: "500081",
    salaryRange: "₹2.8 LPA – 4 LPA",
    experience: "2 – 5 years",
    jobType: "Full time",
    workMode: "Onsite",
    postedAgo: "11 days ago",
    description:
      "Supervise a housekeeping floor team and maintain room readiness to Hilton brand standards.",
    responsibilities: [
      "Allocate and inspect room cleaning",
      "Manage linen and amenity stock",
      "Train and roster the floor team",
      "Log and follow up maintenance issues",
    ],
    requirements: [
      "Diploma in Hotel Management",
      "2+ years in hotel housekeeping",
      "Eye for detail",
      "Basic computer literacy",
    ],
    benefits: ["Duty meals", "Accommodation support", "Incentives", "Growth path"],
  },
  {
    slug: "guest-relations-1011",
    title: "Guest Relations",
    designation: "Premium Guest Relations Executive",
    company: "Emirates",
    vertical: "Airlines",
    location: "Mumbai, MH",
    pincode: "400099",
    salaryRange: "₹5 LPA – 7.5 LPA",
    experience: "2 – 5 years",
    jobType: "Full time",
    workMode: "Onsite",
    postedAgo: "12 days ago",
    description:
      "Look after premium and first-class passengers through the airport journey, from lounge to gate.",
    responsibilities: [
      "Escort and assist premium passengers",
      "Coordinate lounge and fast-track services",
      "Resolve service recovery situations",
      "Maintain service logs",
    ],
    requirements: [
      "Graduate with 2+ years in aviation or luxury hospitality",
      "Impeccable grooming and communication",
      "Fluent English; additional languages a plus",
      "Shift flexibility",
    ],
    benefits: ["Airline staff travel", "Medical cover", "Grooming allowance", "International exposure"],
  },
  {
    slug: "restaurant-manager-1012",
    title: "Restaurant Managers",
    designation: "Restaurant Manager",
    company: "The Oberoi",
    vertical: "Restaurants",
    location: "Chennai, TN",
    pincode: "600002",
    salaryRange: "₹6 LPA – 9 LPA",
    experience: "4 – 8 years",
    jobType: "Full time",
    workMode: "Onsite",
    postedAgo: "2 weeks ago",
    description:
      "Own the P&L, team and guest experience of a signature restaurant at The Oberoi.",
    responsibilities: [
      "Drive covers, revenue and cost control",
      "Lead, roster and train the service team",
      "Maintain brand and hygiene standards",
      "Handle VIP guests and feedback",
    ],
    requirements: [
      "Degree in Hotel Management",
      "4+ years in fine-dining, 2+ in a supervisory role",
      "Strong commercial acumen",
      "Wine and beverage knowledge",
    ],
    benefits: ["Performance bonus", "Duty meals", "Accommodation support", "Leadership development"],
  },
];

export const FEATURED_JOBS_LIST = JOBS.filter((j) => j.featured);

export function getJob(slug: string) {
  return JOBS.find((j) => j.slug === slug);
}
