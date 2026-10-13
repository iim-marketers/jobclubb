import {
  Briefcase,
  CalendarCheck,
  LayoutDashboard,
  Settings,
  UserRoundCheck,
  UserRoundSearch,
} from "lucide-react";

export const COMPANY_HOME = "/company/dashboard";
export const COMPANY_JOBS = `${COMPANY_HOME}/jobs`;
export const COMPANY_APPLICANTS = `${COMPANY_HOME}/applicants`;
export const COMPANY_INTERVIEWS = `${COMPANY_HOME}/interviews`;
export const COMPANY_SELECTED = `${COMPANY_HOME}/selected`;
export const applicantHref = (ref: string) => `${COMPANY_APPLICANTS}/${ref}`;
export const jobApplicantsHref = (jobId: string) =>
  `${COMPANY_APPLICANTS}/jobs/${jobId}`;

export type CompanyNavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const COMPANY_NAV: { title: string; items: CompanyNavItem[] }[] = [
  {
    title: "Hiring",
    items: [
      { label: "Overview", href: COMPANY_HOME, icon: LayoutDashboard },
      { label: "Job postings", href: COMPANY_JOBS, icon: Briefcase },
      { label: "Applicants", href: COMPANY_APPLICANTS, icon: UserRoundSearch },
      { label: "Interviews", href: COMPANY_INTERVIEWS, icon: CalendarCheck },
      { label: "Selected", href: COMPANY_SELECTED, icon: UserRoundCheck },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Settings", href: `${COMPANY_HOME}/settings`, icon: Settings },
    ],
  },
];

export function isActive(pathname: string, href: string) {
  return href === COMPANY_HOME
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function activeNavItem(pathname: string) {
  return COMPANY_NAV.flatMap((g) => g.items).find((i) => isActive(pathname, i.href));
}
