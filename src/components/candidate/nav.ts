import {
  Briefcase,
  CalendarCheck,
  FileText,
  Heart,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";

export const CANDIDATE_HOME = "/candidate/dashboard";

export type CandidateNavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

export const CANDIDATE_NAV: { title: string; items: CandidateNavItem[] }[] = [
  {
    title: "Job search",
    items: [
      { label: "Overview", href: CANDIDATE_HOME, icon: LayoutDashboard },
      { label: "Applications", href: `${CANDIDATE_HOME}/applications`, icon: Briefcase, badge: 4 },
      { label: "Saved jobs", href: `${CANDIDATE_HOME}/saved`, icon: Heart },
      { label: "Interviews", href: `${CANDIDATE_HOME}/interviews`, icon: CalendarCheck },
    ],
  },
  {
    title: "Career",
    items: [
      { label: "My resume", href: `${CANDIDATE_HOME}/resume`, icon: FileText },
      { label: "Membership", href: `${CANDIDATE_HOME}/membership`, icon: Sparkles },
      { label: "Settings", href: `${CANDIDATE_HOME}/settings`, icon: Settings },
    ],
  },
];

export function isActive(pathname: string, href: string) {
  return href === CANDIDATE_HOME
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function activeNavItem(pathname: string) {
  return CANDIDATE_NAV.flatMap((g) => g.items).find((i) => isActive(pathname, i.href));
}
