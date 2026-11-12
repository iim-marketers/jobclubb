import {
  BadgeIndianRupee,
  LayoutDashboard,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";

import {
  FRANCHISE_CANDIDATES,
  FRANCHISE_EARNINGS,
  FRANCHISE_HOME,
  FRANCHISE_REGISTER,
  FRANCHISE_SETTINGS,
} from "@/lib/franchise";

export type FranchiseNavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const FRANCHISE_NAV: { title: string; items: FranchiseNavItem[] }[] = [
  {
    title: "Franchise",
    items: [
      { label: "Overview", href: FRANCHISE_HOME, icon: LayoutDashboard },
      { label: "Candidates", href: FRANCHISE_CANDIDATES, icon: Users },
      { label: "Register a candidate", href: FRANCHISE_REGISTER, icon: UserPlus },
      { label: "Earnings", href: FRANCHISE_EARNINGS, icon: BadgeIndianRupee },
    ],
  },
  {
    title: "Account",
    items: [{ label: "Settings", href: FRANCHISE_SETTINGS, icon: Settings }],
  },
];
