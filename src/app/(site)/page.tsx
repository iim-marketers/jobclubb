import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Check,
  CheckCircle2,
  Lock,
  MapPin,
  Search,
  Shield,
  Star,
  Users,
} from "lucide-react";

import { CompanyAvatar } from "@/components/company-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecruiterBoard } from "@/components/recruiter-board";
import { cn } from "@/lib/utils";
import { JOBS } from "@/lib/jobs-data";
import { PLAN_DETAILS } from "@/lib/membership";
import {
  CHECKOUT_PATH,
  getMembershipView,
  type MembershipView,
} from "@/server/auth/current-candidate";
import {
  ABOUT_STATS,
  CATEGORIES,
  FEATURED_JOBS,
  FRANCHISE_STEPS,
  FRESH_JOBS,
  HERO_STATS,
  HOW_IT_WORKS,
  JOB_FILTERS,
  MEMBERSHIP_FEATURES,
  MEMBERSHIP_POINTS,
  RECRUITER_LOGOS,
  type Job,
} from "@/lib/home-data";

const CAROUSEL =
  "jc-hscroll -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-1 sm:mx-0 sm:grid sm:snap-none sm:scroll-px-0 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0";
const CAROUSEL_ITEM = "w-[82%] flex-none snap-start sm:w-auto";

const STAT_ICONS = {
  shield: Shield,
  check: CheckCircle2,
  chart: BarChart3,
  users: Users,
  star: Star,
} as const;

export default async function Home() {
  const view = await getMembershipView();
  const member = view.kind === "member";

  return (
    <>
      <Hero locked={!member} />
      <StatsBand />
      <EmployerShowcase />
      <FeaturedOpenings locked={!member} />
      <HowItWorks />
      {view.kind !== "member" && <Membership view={view} />}
      <Categories />
      <Franchise />
      <About />
      <ClosingCta view={view} />
    </>
  );
}

function Hero({ locked }: { locked: boolean }) {
  return (
    <section className="bg-linear-to-b from-muted/60 to-background px-4 pt-8 pb-12 md:py-12 sm:px-6 lg:py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="min-w-0">
          <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground shadow-sm">
            {/* <span className="rounded-full bg-good/15 px-2.5 py-0.5 font-head text-xs font-bold text-good">
              NEW
            </span> */}
            3 guaranteed interviews for members
          </span>

          <h1 className="mt-0 md:mt-5 font-head text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Find your <span className="text-brand">dream job</span> now.
          </h1>

          <span className="mt-5 inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground shadow-sm md:hidden">
            3 guaranteed interviews for members
          </span>

          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
            5 lakh+ live jobs from verified employers. Get matched, prepare with
            upskilling, and land the role that&apos;s right for you.
          </p>

          <form className="mt-7 flex max-w-xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-md sm:flex-row">
            <div className="relative flex-1 border-b border-border sm:border-b-0 -mx-2 px-2">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Job title, skill or company"
                placeholder="Job title, skill or company"
                className="h-11 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
              />
            </div>
            <Button
              type="submit"
              className="h-11 bg-brand px-6 font-head text-brand-foreground hover:bg-brand-dark"
            >
              Search Jobs
            </Button>
          </form>

          {/* <ul className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            {["Verified employers", "3 guaranteed interviews"].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check className="size-4 text-brand-accent" />
                {item}
              </li>
            ))}
          </ul> */}
        </div>

        <div className="min-w-0 rounded-3xl border border-border bg-card p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="font-head text-lg font-bold tracking-tight">
              Fresh today
            </h2>
            <span className="flex items-center gap-2 text-sm font-medium text-good">
              <span className="size-2 animate-pulse rounded-full bg-good" />
              Live
            </span>
          </div>

          <ul className="mt-4 space-y-3">
            {FRESH_JOBS.map((job, i) => (
              <li
                key={`${job.role}-${i}`}
                className="flex items-center gap-3 rounded-2xl border border-border p-3 transition-colors hover:border-brand/40"
              >
                {locked ? (
                  <span
                    aria-hidden
                    className={cn(
                      "size-10 flex-none rounded-full bg-muted",
                      HIDDEN,
                    )}
                  />
                ) : (
                  <CompanyAvatar name={job.company} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-head text-sm font-bold">
                    {job.role}
                  </p>
                  <p
                    aria-hidden={locked}
                    className={cn(
                      "truncate text-xs text-muted-foreground",
                      locked && HIDDEN,
                    )}
                  >
                    {locked
                      ? "Company name · City"
                      : `${job.company} · ${job.location}`}
                  </p>
                </div>
                <span
                  aria-hidden={locked}
                  className={cn(
                    "font-head text-sm font-bold text-brand",
                    locked && HIDDEN,
                  )}
                >
                  {locked ? "₹0L" : job.salary}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            and many more inside
          </p>
        </div>
      </div>
    </section>
  );
}

function StatsBand() {
  return (
    <section className="bg-brand-surface px-4 py-12 text-white sm:px-6">
      <div className="-mx-4 overflow-hidden sm:hidden">
        <div
          className="jc-marquee flex w-max gap-10"
          style={{ animationDuration: "24s" }}
        >
          {[...HERO_STATS, ...HERO_STATS].map((stat, i) => (
            <StatItem
              key={`${stat.label}-${i}`}
              stat={stat}
              aria-hidden={i >= HERO_STATS.length || undefined}
            />
          ))}
        </div>
      </div>
      <div className="mx-auto hidden max-w-6xl gap-8 sm:grid sm:grid-cols-3 lg:grid-cols-5">
        {HERO_STATS.map((stat) => (
          <StatItem key={stat.label} stat={stat} />
        ))}
      </div>
    </section>
  );
}

function StatItem({
  stat,
  ...props
}: {
  stat: (typeof HERO_STATS)[number];
} & React.HTMLAttributes<HTMLDivElement>) {
  const Icon = STAT_ICONS[stat.icon];
  return (
    <div className="flex-none text-center" {...props}>
      <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-white/10">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 font-head text-xl font-extrabold tracking-tight">
        {stat.value}
      </p>
      <p className="mt-1 text-sm whitespace-nowrap text-white/75 sm:whitespace-normal">
        {stat.label}
      </p>
    </div>
  );
}

function EmployerShowcase() {
  return (
    <section className="border-b border-border bg-card px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto flex max-w-6xl gap-8 flex-col">
        <div>
          <SectionEyebrow>Where our members land</SectionEyebrow>
          <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight sm:text-4xl">
            Placed at {Math.floor(RECRUITER_LOGOS.length / 10) * 10}+ leading
            employers
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
            From five-star hotels to airlines, JobClubb members interview
            directly with the brands that are hiring right now.
          </p>
        </div>

        <RecruiterBoard logos={RECRUITER_LOGOS} />
      </div>
    </section>
  );
}

function FeaturedOpenings({ locked }: { locked: boolean }) {
  return (
    <section className="px-4 py-12 md:py-16  sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow>Featured openings</SectionEyebrow>
        <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight sm:text-4xl">
          Jobs actively hiring now
        </h2>

        <div className="jc-hscroll -mx-4 mt-6 flex gap-2 overflow-x-auto overscroll-x-contain px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {JOB_FILTERS.map((filter, i) => (
            <button
              key={filter}
              type="button"
              aria-pressed={i === 0}
              className="flex-none rounded-full border border-border px-4 py-2 font-head text-sm font-semibold whitespace-nowrap transition-colors aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-brand-foreground"
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="jc-hscroll -mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:snap-none lg:scroll-px-0 lg:grid-cols-2 lg:overflow-visible lg:px-0 lg:pb-0">
          {FEATURED_JOBS.map((job, i) => (
            <JobCard
              key={`${job.role}-${i}`}
              job={job}
              locked={locked}
              className="w-[84%] flex-none snap-start sm:w-[60%] md:w-[46%] lg:w-auto"
            />
          ))}
        </div>

        {locked ? (
          <div className="relative mt-4 overflow-hidden rounded-3xl border border-border bg-card">
            <div
              aria-hidden
              className="grid max-h-96 gap-4 overflow-hidden p-5 blur-[6px] select-none lg:max-h-none lg:grid-cols-2"
            >
              {FEATURED_JOBS.slice(0, 4).map((job) => (
                <JobCard key={`ghost-${job.role}`} job={job} locked />
              ))}
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/70 px-6 text-center backdrop-blur-[2px]">
              <span className="flex size-14.5 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-lg">
                <Lock className="size-6" />
              </span>
              <h3 className="mt-4 font-head text-xl font-bold tracking-tight">
                Many more jobs inside
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Membership unlocks the full job board, one-click apply, and
                priority support with hiring employers.
              </p>
              <Button
                className="mt-5 bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                nativeButton={false}
                render={<Link href="/membership" />}
              >
                Become a Member to unlock
              </Button>
            </div>
          </div>
        ) : (
          <MemberJobsBanner />
        )}
      </div>
    </section>
  );
}

function MemberJobsBanner() {
  const sectors = Object.entries(
    JOBS.reduce<Record<string, number>>((counts, job) => {
      counts[job.vertical] = (counts[job.vertical] ?? 0) + 1;
      return counts;
    }, {}),
  ).sort(([, a], [, b]) => b - a);

  return (
    <div className="jc-auth-panel relative isolate mt-4 overflow-hidden rounded-3xl p-6 text-white sm:p-8 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-head text-xs font-bold text-white">
            <CheckCircle2 className="size-3.5 text-brand-accent" />
            Full access unlocked
          </span>
          <h3 className="mt-4 font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
            {JOBS.length} live openings waiting for you
          </h3>
          <p className="mt-2 max-w-md leading-7 text-white/75">
            See every detail, apply in one click and use your guaranteed
            interviews with hiring employers.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              className="bg-white font-head text-brand hover:bg-white/90"
              nativeButton={false}
              render={<Link href="/jobs" />}
            >
              Browse all jobs
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="border-white/30 bg-transparent font-head text-white hover:bg-white/10 hover:text-white"
              nativeButton={false}
              render={<Link href="/candidate/dashboard/applications" />}
            >
              My applications
            </Button>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sectors.map(([sector, count]) => (
            <li key={sector}>
              <Link
                href="/jobs"
                className="group flex h-full flex-col justify-between gap-3 rounded-2xl border border-white/12 bg-white/8 p-4 transition-colors hover:border-white/30 hover:bg-white/14"
              >
                <span className="font-head text-sm font-semibold leading-5">
                  {sector}
                </span>
                <span className="flex items-center justify-between text-xs text-white/65">
                  {count} open {count === 1 ? "role" : "roles"}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Non-members see only the role; the rest is placeholder text under a blur,
// so the real company, location and salary never reach the page.
const HIDDEN = "blur-[5px] select-none";

const PLACEHOLDER: Omit<Job, "role"> = {
  company: "Company name",
  location: "City",
  type: "job type",
  category: "Category",
  salary: "₹0 LPA – 0 LPA",
  postedAgo: "Recently",
};

function JobCard({
  job,
  locked,
  className,
}: {
  job: Job;
  locked: boolean;
  className?: string;
}) {
  const shown = locked ? { ...PLACEHOLDER, role: job.role } : job;
  const hidden = locked ? HIDDEN : undefined;

  return (
    <article
      className={cn(
        "group min-w-0 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {locked ? (
          <span
            aria-hidden
            className={cn("size-10 flex-none rounded-full bg-muted", HIDDEN)}
          />
        ) : (
          <CompanyAvatar name={job.company} />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-head font-bold tracking-tight transition-colors group-hover:text-brand">
            {shown.role}
          </h3>
          <p
            aria-hidden={locked}
            className={cn("truncate text-sm text-muted-foreground", hidden)}
          >
            {shown.company}
          </p>
        </div>
        {!locked && job.featured && (
          <span className="flex-none rounded-full bg-brand-accent/15 px-2.5 py-1 font-head text-[10px] font-bold tracking-wide text-good uppercase">
            Featured
          </span>
        )}
      </div>

      <ul
        aria-hidden={locked}
        className={cn("mt-4 flex flex-wrap gap-2", hidden)}
      >
        <MetaPill icon={MapPin}>{shown.location}</MetaPill>
        <MetaPill icon={Briefcase}>{shown.type}</MetaPill>
        <MetaPill>{shown.category}</MetaPill>
      </ul>

      <div
        aria-hidden={locked}
        className="mt-4 -mx-5 px-5 flex items-center justify-between border-t border-border pt-4"
      >
        <span className={cn("font-head text-sm font-bold text-brand", hidden)}>
          {shown.salary}
        </span>
        <span className={cn("text-xs text-muted-foreground", hidden)}>
          {shown.postedAgo}
        </span>
      </div>
    </article>
  );
}

function MetaPill({
  icon: Icon,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
      {Icon && <Icon className="size-3" />}
      {children}
    </li>
  );
}

function HowItWorks() {
  return (
    <section className="bg-card px-4 py-12 md:py-16  sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow>For job seekers</SectionEyebrow>
        <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight sm:text-4xl">
          How JobClubb works
        </h2>

        <ol className={cn(CAROUSEL, "mt-10 sm:grid-cols-2 lg:grid-cols-4")}>
          {HOW_IT_WORKS.map((item) => (
            <li
              key={item.step}
              className={cn(
                CAROUSEL_ITEM,
                "rounded-2xl border border-border bg-background p-6",
              )}
            >
              <span className="font-head text-3xl font-extrabold text-brand/25">
                {item.step}
              </span>
              <h3 className="mt-3 font-head font-bold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Membership({
  view,
}: {
  view: Exclude<MembershipView, { kind: "member" }>;
}) {
  const plan = view.kind === "guest" ? "member" : view.plan;
  const details = PLAN_DETAILS[plan];
  const card = {
    guest: {
      badge: "Most popular",
      cta: "Join JobClubb now",
      href: "/membership",
      note: "One year of membership. Renewal reminder before it ends.",
    },
    unpaid: {
      badge: "Payment pending",
      cta: `Pay ${details.price} to activate`,
      href: CHECKOUT_PATH,
      note: "Activate to unlock jobs, applying and guaranteed interviews.",
    },
  }[view.kind];

  return (
    <section className="px-4 py-12 md:py-16 sm:px-6">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionEyebrow>Why JobClubb membership</SectionEyebrow>
          <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your days of job searching are over
          </h2>

          <ul className="mt-7 space-y-4">
            {MEMBERSHIP_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 flex-none items-center justify-center rounded-full bg-brand-accent/15">
                  <Check className="size-3 text-good" />
                </span>
                <span className="text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-3xl border border-border bg-card p-8 shadow-lg">
          <span
            className={cn(
              "absolute -top-3 left-8 rounded-full px-3 py-1 font-head text-xs font-bold",
              view.kind === "unpaid"
                ? "bg-amber-500 text-white"
                : "bg-brand text-brand-foreground",
            )}
          >
            {card.badge}
          </span>

          <h3 className="font-head text-lg font-bold tracking-tight">
            {details.name}
          </h3>

          <p className="mt-4 flex flex-wrap items-baseline gap-2">
            <span className="font-head text-4xl font-extrabold tracking-tight text-brand">
              {details.price}
            </span>
            {plan === "franchise" && (
              <span className="text-lg text-muted-foreground line-through">
                {PLAN_DETAILS.member.price}
              </span>
            )}
            <span className="text-sm text-muted-foreground">/ year</span>
          </p>

          <ul className="mt-6 space-y-3">
            {MEMBERSHIP_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 size-4 flex-none text-good" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            className="mt-7 w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href={card.href} />}
          >
            {card.cta}
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            {card.note}
          </p>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section className="bg-card px-4 py-12 md:py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow>Explore</SectionEyebrow>
        <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight sm:text-4xl">
          Discover jobs across popular roles
        </h2>

        <div className={cn(CAROUSEL, "mt-8 sm:grid-cols-2 lg:grid-cols-3")}>
          {CATEGORIES.map((category) => (
            <Link
              key={category.name}
              href={`/jobs?category=${encodeURIComponent(category.name)}`}
              className={cn(
                CAROUSEL_ITEM,
                "group flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-5 transition-colors hover:border-brand",
              )}
            >
              <span>
                <span className="block font-head font-bold tracking-tight transition-colors group-hover:text-brand">
                  {category.name}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {category.count} open roles
                </span>
              </span>
              <ArrowRight className="size-4 flex-none text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Franchise() {
  return (
    <section className="px-4 py-12 md:py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <SectionEyebrow>Partner with us</SectionEyebrow>
          <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight sm:text-4xl">
            Join our franchise program
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Become our partner and build a successful job placement &amp;
            recruitment business in your area - with a proven model, full
            training, and lifelong support.
          </p>
          <Button
            className="mt-6 bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href="/franchise" />}
          >
            Become a partner
          </Button>
        </div>

        <ol className={cn(CAROUSEL, "mt-10 sm:grid-cols-2 lg:grid-cols-4")}>
          {FRANCHISE_STEPS.map((item) => (
            <li
              key={item.step}
              className={cn(
                CAROUSEL_ITEM,
                "rounded-2xl border border-border bg-card p-6",
              )}
            >
              <span className="font-head text-3xl font-extrabold text-brand/25">
                {item.step}
              </span>
              <h3 className="mt-3 font-head font-bold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="bg-card px-4 py-12 md:py-16 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
        <div>
          <SectionEyebrow>About JobClubb</SectionEyebrow>
          <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight sm:text-4xl">
            Find the one that&apos;s right for you
          </h2>

          <div className="mt-7 space-y-6">
            <div>
              <h3 className="font-head font-bold tracking-tight text-brand">
                Our Mission
              </h3>
              <p className="mt-2 leading-7 text-muted-foreground">
                To offer the right business solutions in the most ethical,
                high-quality and superior way - integrating cost-efficient
                people, better processes and new technologies to connect talent
                with opportunity.
              </p>
            </div>
            <div>
              <h3 className="font-head font-bold tracking-tight text-brand">
                Our Vision
              </h3>
              <p className="mt-2 leading-7 text-muted-foreground">
                Where talent meets opportunity, we help job seekers find
                meaningful work and help businesses thrive.
              </p>
            </div>
          </div>

          <Link
            href="/about"
            className="mt-6 inline-flex items-center gap-2 py-1.5 font-head text-sm font-semibold text-brand hover:underline"
          >
            Read more about us
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 self-start">
          {ABOUT_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-background p-6"
            >
              <p className="font-head text-2xl font-extrabold tracking-tight text-brand">
                {stat.value}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta({ view }: { view: MembershipView }) {
  const primary = {
    guest: { label: "Become a Member", href: "/membership" },
    unpaid: { label: "Complete payment", href: CHECKOUT_PATH },
    member: { label: "Go to dashboard", href: "/candidate/dashboard" },
  }[view.kind];

  return (
    <section className="px-4 py-12 md:py-16 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-3xl bg-linear-to-br from-brand-surface to-brand-surface-strong px-5 py-12 sm:px-8 sm:py-14 text-center text-white shadow-lg">
        <h2 className="font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
          Looking for a career change?
        </h2>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-white/80">
          {view.kind === "member"
            ? "Browse the latest openings and apply in one click — JobClubb gets you hired faster."
            : "Browse our job listings, become a member, and let JobClubb get you hired faster."}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            className="bg-white font-head text-brand hover:bg-white/90"
            nativeButton={false}
            render={<Link href={primary.href} />}
          >
            {primary.label}
          </Button>
          <Button
            variant="outline"
            className="border-white/40 bg-transparent font-head text-white hover:bg-white/10 hover:text-white"
            nativeButton={false}
            render={<Link href="/jobs" />}
          >
            Browse jobs
          </Button>
        </div>
      </div>
    </section>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-head text-xs font-bold tracking-[0.14em] text-brand uppercase">
      {children}
    </p>
  );
}
