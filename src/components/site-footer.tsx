import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { FacebookIcon, InstagramIcon } from "@/components/brand-icons";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import {
  COMPANY_APPLICANTS,
  COMPANY_HOME,
  COMPANY_INTERVIEWS,
  COMPANY_JOBS,
  COMPANY_SELECTED,
} from "@/components/company/nav";
import { CHECKOUT_PATH } from "@/lib/membership";
import {
  getCandidateSession,
  getLapsedAccess,
  getMembershipView,
} from "@/server/auth/current-candidate";
import { getCompanySession } from "@/server/auth/current-company";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Jobs", href: "/jobs" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

const EXPLORE_LINKS = [
  { label: "Companies", href: "/companies" },
  { label: "Membership", href: "/membership" },
  { label: "Franchise", href: "/franchise" },
];

type FooterLink = { label: string; href: string };
type FooterColumns = { title: string; links: FooterLink[] }[];

const VISITOR_COLUMNS: FooterColumns = [
  { title: "Quick links", links: QUICK_LINKS },
  { title: "Explore", links: EXPLORE_LINKS },
];

const MEMBER_COLUMNS: FooterColumns = [
  {
    title: "Your account",
    links: [
      { label: "Dashboard", href: CANDIDATE_HOME },
      { label: "Applications", href: `${CANDIDATE_HOME}/applications` },
      { label: "Interviews", href: `${CANDIDATE_HOME}/interviews` },
      { label: "Saved jobs", href: `${CANDIDATE_HOME}/saved` },
      { label: "My resume", href: `${CANDIDATE_HOME}/resume` },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Browse jobs", href: "/jobs" },
      { label: "Membership & billing", href: `${CANDIDATE_HOME}/membership` },
      { label: "How it Works", href: "/how-it-works" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

// Lapsed members keep only these dashboard pages until their access ends.
const LAPSED_COLUMNS: FooterColumns = [
  {
    title: "Your account",
    links: [
      { label: "Applications", href: `${CANDIDATE_HOME}/applications` },
      { label: "Interviews", href: `${CANDIDATE_HOME}/interviews` },
      { label: "Settings", href: `${CANDIDATE_HOME}/settings` },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Renew membership", href: CHECKOUT_PATH },
      { label: "Membership & billing", href: `${CANDIDATE_HOME}/membership` },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

const COMPANY_COLUMNS: FooterColumns = [
  {
    title: "Hiring",
    links: [
      { label: "Post a job", href: `${COMPANY_JOBS}/new` },
      { label: "Job postings", href: COMPANY_JOBS },
      { label: "Applicants", href: COMPANY_APPLICANTS },
      { label: "Interviews", href: COMPANY_INTERVIEWS },
      { label: "Selected candidates", href: COMPANY_SELECTED },
    ],
  },
  {
    title: "Account & help",
    links: [
      { label: "Dashboard", href: COMPANY_HOME },
      { label: "Settings", href: `${COMPANY_HOME}/settings` },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

const LEGAL_LINKS = [
  { label: "Terms of Use", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Refund Policy", href: "/refund-policy" },
];

export const CONTACT_ITEMS = [
  { icon: MapPin, text: "Kolkata, India", href: null },
  {
    icon: Mail,
    text: "support@jobclubb.com",
    href: "mailto:support@jobclubb.com",
  },
  { icon: Phone, text: "+91-7439922120", href: "tel:+917439922120" },
  { icon: Clock, text: "Mon-Sat, 10:30am - 6:30pm", href: null },
];

async function footerAudience() {
  if (await getCandidateSession()) {
    const view = await getMembershipView();
    if (view.kind === "member") return "member";
    if (view.kind === "unpaid" && (await getLapsedAccess())) return "lapsed";
    return "visitor";
  }
  return (await getCompanySession()) ? "company" : "visitor";
}

export async function SiteFooter() {
  const audience = await footerAudience();
  const columns = {
    visitor: VISITOR_COLUMNS,
    member: MEMBER_COLUMNS,
    lapsed: LAPSED_COLUMNS,
    company: COMPANY_COLUMNS,
  }[audience];
  const socialLinks = [
    {
      label: "Facebook",
      href: process.env.NEXT_PUBLIC_FACEBOOK_URL,
      icon: FacebookIcon,
    },
    {
      label: "Instagram",
      href: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
      icon: InstagramIcon,
    },
  ].filter((link): link is typeof link & { href: string } => !!link.href);

  return (
    <footer className="footer-surface border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:pr-6">
            <Image
              src="/brand/jobclubb-logo-dark.png"
              alt="JobClubb"
              width={142}
              height={26}
              className="object-contain"
            />
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {audience === "company"
                ? "Hire verified, interview-ready candidates near your property."
                : "Where talent meets opportunity. We connect job seekers with the right employers and help careers begin."}
            </p>
            {socialLinks.length > 0 && (
              <div className="mt-5 flex items-center gap-3">
                {socialLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    aria-label={`JobClubb on ${label}`}
                    className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand sm:size-9"
                  >
                    <Icon className="size-4" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {columns.map((column) => (
            <FooterColumn key={column.title} {...column} />
          ))}

          <div>
            <h3 className="font-head text-sm font-bold tracking-wide text-foreground">
              Contact us
            </h3>
            <ul className="mt-4 space-y-3">
              {CONTACT_ITEMS.map(({ icon: Icon, text, href }) => (
                <li
                  key={text}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <Icon className="mt-0.5 size-4 flex-none text-brand" />
                  {href ? (
                    <Link
                      href={href}
                      className="-my-1 inline-block py-1 transition-colors hover:text-brand"
                    >
                      {text}
                    </Link>
                  ) : (
                    <span>{text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-head font-semibold text-foreground">
              JobClubb
            </span>{" "}
            © {new Date().getFullYear()}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="-my-1 inline-block py-1 transition-colors hover:text-brand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <h3 className="font-head text-sm font-bold tracking-wide text-foreground">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="-my-1 inline-block py-1.5 text-sm text-muted-foreground transition-colors hover:text-brand"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
