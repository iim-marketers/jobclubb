// Taxonomy per JobClubb SOP §4.1 and "Sectors & Roles We Cover".

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

export const JOB_TYPES = ["Full time", "Internship"] as const;
export const WORK_MODES = ["WFO", "WFH", "Hybrid", "Field", "Onsite"] as const;

export const SOURCING_CHANNELS = [
  "Digital marketing",
  "Emporium",
  "Franchise",
  "Reference / word of mouth",
] as const;
