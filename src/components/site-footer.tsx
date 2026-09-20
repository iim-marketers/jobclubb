import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { FacebookIcon, InstagramIcon } from "@/components/brand-icons";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Jobs", href: "/jobs" },
  { label: "About Us", href: "/about" },
  { label: "Terms of Use", href: "/terms" },
];

const EXPLORE_LINKS = [
  { label: "Companies", href: "/companies" },
  { label: "Membership", href: "/membership" },
  { label: "Franchise", href: "/franchise" },
];

const CONTACT_ITEMS = [
  { icon: MapPin, text: "Kolkata, India", href: null },
  { icon: Mail, text: "contact@jobclubb.com", href: "mailto:contact@jobclubb.com" },
  { icon: Phone, text: "+91 90739 33000", href: "tel:+919073933000" },
  { icon: Clock, text: "Mon-Sat, 10:30am - 6:30pm", href: null },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:pr-6">
            <Image
              src="/brand/jobclubb-logo.png"
              alt="JobClubb"
              width={142}
              height={26}
              className="object-contain dark:hidden"
            />
            <Image
              src="/brand/jobclubb-logo-dark.png"
              alt=""
              aria-hidden
              width={142}
              height={26}
              className="hidden object-contain dark:block"
            />
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Where talent meets opportunity. We connect job seekers with the right
              employers and help careers begin.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Link
                href="https://facebook.com"
                aria-label="JobClubb on Facebook"
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand"
              >
                <FacebookIcon className="size-4" />
              </Link>
              <Link
                href="https://instagram.com"
                aria-label="JobClubb on Instagram"
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand"
              >
                <InstagramIcon className="size-4" />
              </Link>
            </div>
          </div>

          <FooterColumn title="Quick links" links={QUICK_LINKS} />
          <FooterColumn title="Explore" links={EXPLORE_LINKS} />

          <div>
            <h3 className="font-head text-sm font-bold tracking-wide text-foreground">
              Contact us
            </h3>
            <ul className="mt-4 space-y-3">
              {CONTACT_ITEMS.map(({ icon: Icon, text, href }) => (
                <li key={text} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Icon className="mt-0.5 size-4 flex-none text-brand" />
                  {href ? (
                    <Link href={href} className="transition-colors hover:text-brand">
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
            <span className="font-head font-semibold text-foreground">JobClubb</span> ©{" "}
            {new Date().getFullYear()}. All rights reserved.
          </p>
          <p>Where careers begin and businesses thrive.</p>
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
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="font-head text-sm font-bold tracking-wide text-foreground">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-brand"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
