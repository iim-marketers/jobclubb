import Image from "next/image";
import Link from "next/link";

import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Jobs", href: "/jobs" },
  { label: "Companies", href: "/companies" },
  { label: "How it Works", href: "/how-it-works" },
  { label: "Membership", href: "/membership" },
  { label: "Franchise", href: "/franchise" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:h-[72px] lg:gap-8">
        <Link
          href="/"
          aria-label="JobClubb — home"
          className="flex min-w-0 flex-none items-center rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Image
            src="/brand/jobclubb-logo.png"
            alt="JobClubb"
            width={142}
            height={26}
            priority
            className="h-5 w-auto object-contain sm:h-[26px] dark:hidden"
          />
          <Image
            src="/brand/jobclubb-logo-dark.png"
            alt=""
            aria-hidden
            width={142}
            height={26}
            priority
            className="hidden h-5 w-auto object-contain sm:h-[26px] dark:block"
          />
        </Link>

        <nav className="hidden flex-1 items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-head text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex flex-none items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="hidden font-head lg:inline-flex"
            nativeButton={false}
            render={<Link href="/sign-in" />}
          >
            Sign in
          </Button>
          <Button
            size="sm"
            className="hidden bg-brand font-head whitespace-nowrap text-brand-foreground hover:bg-brand-dark sm:inline-flex"
            nativeButton={false}
            render={<Link href="/membership" />}
          >
            Become a Member
          </Button>
          <MobileNav links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
