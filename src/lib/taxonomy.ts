/**
 * Sector / vertical / role taxonomy.
 * Source: JobClubb SOP §4.1 "Target Companies & Role Specializations"
 * and the "Sectors & Roles We Cover" section of the proposal.
 */

export type Vertical = {
  slug: string;
  name: string;
  sector: "Airlines" | "Hospitality" | "Travel & Tourism";
  roles: string[];
};

export const VERTICALS: Vertical[] = [
  {
    slug: "airlines",
    name: "Airlines",
    sector: "Airlines",
    roles: [
      "Cabin Crew",
      "Ground Staff",
      "Lounge Staff",
      "Check-in Agents",
      "Guest Relations",
      "Ramp Agents",
      "Baggage Handling Staff",
      "Ticketing & Reservations Agents",
      "Airport Customer Service Agents",
      "Cargo & Logistics Staff",
      "In-Flight Service Crew",
      "Aviation Security Staff",
      "Flight Dispatch Executives",
      "VIP & Premium Services Staff",
    ],
  },
  {
    slug: "hotels",
    name: "Hotels",
    sector: "Hospitality",
    roles: [
      "Front Office / Reception",
      "Housekeeping Staff",
      "Concierge",
      "Guest Relations Executives",
      "F&B Service Staff",
      "Chefs & Kitchen Staff",
      "Banquet & Events Staff",
      "Spa & Wellness Staff",
      "Hotel Management Trainees",
      "Sales & Marketing Executives",
      "Revenue Management Executives",
    ],
  },
  {
    slug: "restaurants",
    name: "Restaurants",
    sector: "Hospitality",
    roles: [
      "Waitstaff / Servers",
      "Chefs & Sous Chefs",
      "Restaurant Managers",
      "Hosts / Hostesses",
      "Kitchen Stewards",
      "Restaurant Supervisors",
    ],
  },
  {
    slug: "cafes",
    name: "Cafes",
    sector: "Hospitality",
    roles: [
      "Baristas",
      "Cafe Managers",
      "Counter Staff",
      "Pastry Chefs",
      "Cafe Supervisors",
    ],
  },
  {
    slug: "bars-nightclubs",
    name: "Bars & Nightclubs",
    sector: "Hospitality",
    roles: [
      "Bartenders",
      "Mixologists",
      "Club / Bar Managers",
      "DJs",
      "Security & Bouncers",
      "VIP Hosts",
    ],
  },
  {
    slug: "cruise-lines",
    name: "Cruise Lines",
    sector: "Hospitality",
    roles: [
      "Cruise Staff",
      "Casino Dealers / Croupiers",
      "Entertainment Staff",
      "Guest Services Staff",
      "Spa & Wellness Staff",
      "Deck Crew",
      "Cruise Directors",
    ],
  },
  {
    slug: "travel-tourism",
    name: "Travel & Tourism",
    sector: "Travel & Tourism",
    roles: [
      "Reservation Agents",
      "Flight Booking Executives",
      "Hotel Booking Executives",
      "Car Rental Executives",
      "Holiday Package Consultants",
      "Visa Processing Executives",
      "Tour Coordinators",
      "Travel Counselors",
      "MICE Executives",
      "Forex Executives",
    ],
  },
];

/** Employer list — SOP Tab 2, "Please add these co." */
export const EMPLOYER_DIRECTORY: {
  name: string;
  vertical: string;
  openRoles: number;
}[] = [
  // Airlines
  { name: "Singapore Airlines", vertical: "Airlines", openRoles: 6 },
  { name: "Qatar Airways", vertical: "Airlines", openRoles: 9 },
  { name: "Emirates", vertical: "Airlines", openRoles: 11 },
  { name: "Saudi Arabian Airlines", vertical: "Airlines", openRoles: 4 },
  { name: "Etihad", vertical: "Airlines", openRoles: 7 },
  { name: "Gulf Air", vertical: "Airlines", openRoles: 3 },
  { name: "Air India", vertical: "Airlines", openRoles: 14 },
  { name: "IndiGo", vertical: "Airlines", openRoles: 18 },
  // Hotels
  { name: "The Oberoi", vertical: "Hotels", openRoles: 8 },
  { name: "Taj", vertical: "Hotels", openRoles: 12 },
  { name: "J.W. Marriott", vertical: "Hotels", openRoles: 9 },
  { name: "The St. Regis", vertical: "Hotels", openRoles: 4 },
  { name: "The Ritz-Carlton", vertical: "Hotels", openRoles: 5 },
  { name: "Hyatt", vertical: "Hotels", openRoles: 7 },
  { name: "ITC Welcomgroup", vertical: "Hotels", openRoles: 6 },
  { name: "Leela Kempinski", vertical: "Hotels", openRoles: 4 },
  { name: "Le Meridien", vertical: "Hotels", openRoles: 5 },
  { name: "Accor Hotels", vertical: "Hotels", openRoles: 8 },
  { name: "Shangri-La", vertical: "Hotels", openRoles: 3 },
  { name: "The Park Hotel", vertical: "Hotels", openRoles: 4 },
  { name: "Four Seasons", vertical: "Hotels", openRoles: 6 },
  { name: "Crowne Plaza", vertical: "Hotels", openRoles: 5 },
  { name: "Swissotel", vertical: "Hotels", openRoles: 3 },
  { name: "Jumeirah Beach Resort Dubai", vertical: "Hotels", openRoles: 7 },
  { name: "ORYX Rotana Dubai", vertical: "Hotels", openRoles: 4 },
  { name: "Hilton Group", vertical: "Hotels", openRoles: 10 },
  // Cruise Lines
  { name: "Dream Cruises", vertical: "Cruise Lines", openRoles: 6 },
  { name: "Star Cruises", vertical: "Cruise Lines", openRoles: 5 },
  // Travel Platforms
  { name: "MakeMyTrip", vertical: "Travel & Tourism", openRoles: 9 },
  { name: "Yatra.com", vertical: "Travel & Tourism", openRoles: 6 },
  { name: "easemytrip.com", vertical: "Travel & Tourism", openRoles: 5 },
  { name: "cleartrip.com", vertical: "Travel & Tourism", openRoles: 4 },
  { name: "Ixigo.com", vertical: "Travel & Tourism", openRoles: 3 },
  { name: "Travelmaxx", vertical: "Travel & Tourism", openRoles: 2 },
];

/** SOP §4.3 — job vacancy fields */
export const JOB_TYPES = ["Full time", "Internship"] as const;
export const WORK_MODES = ["WFO", "WFH", "Hybrid", "Field", "Onsite"] as const;

/** SOP §3.1 — candidate sourcing channels */
export const SOURCING_CHANNELS = [
  "Digital marketing",
  "Emporium",
  "Franchise",
  "Reference / word of mouth",
] as const;
