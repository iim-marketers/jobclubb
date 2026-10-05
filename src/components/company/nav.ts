import {
  Briefcase,
  CalendarCheck,
  LayoutDashboard,
  Settings,
  UserRoundSearch,
} from "lucide-react";

export const COMPANY_HOME = "/company/dashboard";
export const COMPANY_JOBS = `${COMPANY_HOME}/jobs`;

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
      { label: "Applicants", href: `${COMPANY_HOME}/applicants`, icon: UserRoundSearch },
      { label: "Interviews", href: `${COMPANY_HOME}/interviews`, icon: CalendarCheck },
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
