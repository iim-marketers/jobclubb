export type JobListing = {
  // Role + id only: the URL is visible to non-members, so no company or city.
  slug: string;
  title: string;
  designation: string;
  company: string;
  companyLogoUrl?: string | null;
  industry: string;
  location: string;
  pincode: string;
  salaryRange: string;
  experience: string;
  jobType: "Full time" | "Internship";
  workMode: "WFO" | "WFH" | "Hybrid" | "Field" | "Onsite";
  postedAgo: string;
  featured?: boolean;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
};
