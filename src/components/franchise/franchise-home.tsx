import Link from "next/link";
import {
  ArrowRight,
  BadgeIndianRupee,
  Briefcase,
  CalendarClock,
  Clock,
  LayoutDashboard,
  MapPin,
  Trophy,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { EmptyState } from "@/components/candidate/dashboard-ui";
import { CompanyAvatar } from "@/components/company-avatar";
import { CopyCode } from "@/components/copy-code";
import { RecruiterBoard } from "@/components/recruiter-board";
import { SectionEyebrow } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { industryName } from "@/lib/company-jobs";
import {
  COMMISSION_KIND_LABELS,
  COMMISSION_STATE_BADGES,
  COMMISSION_STATE_LABELS,
  FRANCHISE_CANDIDATES,
  FRANCHISE_EARNINGS,
  FRANCHISE_HOME,
  FRANCHISE_REGISTER,
  FRANCHISE_STATUS_BADGES,
  FRANCHISE_STATUS_LABELS,
  franchiseNotice,
} from "@/lib/franchise";
import { greeting } from "@/lib/greeting";
import { formatDateOnly, formatRupees, todayIst } from "@/lib/placements";
import { cn } from "@/lib/utils";
import type { CurrentFranchise } from "@/server/franchises/current";
import {
  listFranchiseCandidates,
  type FranchiseCandidate,
} from "@/server/franchises/franchises";
import type { Commission } from "@/server/franchises/ledger";
import { getLedger } from "@/server/franchises/ledger";
import { getHireBrands } from "@/server/hire-brands/directory";

const SHOWN = 6;

const EARNING_POINTS = [
  {
    icon: UserPlus,
    title: "₹749.50 per candidate",
    body: "Half of the ₹1,499 membership, when a candidate you registered pays for their first year.",
  },
  {
    icon: Trophy,
    title: "50% of the placement fee",
    body: "When they're placed and pay JobClubb one month's salary, you get half of what they pay.",
  },
  {
    icon: Wallet,
    title: "Paid in 2 working days",
    body: "By bank transfer, once a membership is paid from your dashboard or JobClubb receives a placement fee.",
  },
];

export async function FranchiseHome({
  franchise,
}: {
  franchise: CurrentFranchise;
}) {
  const [candidates, ledger, brands] = await Promise.all([
    listFranchiseCandidates(franchise.id, { paidOnly: true }),
    getLedger(franchise.id),
    getHireBrands(),
  ]);

  const active = candidates.filter((c) => c.membershipActive).length;
  const placed = candidates.filter((c) => c.placement === "joined").length;
  const canRegister = franchise.status === "active";
  const notice = franchiseNotice(franchise);

  return (
    <>
      <section className="jc-auth-panel relative isolate px-4 pt-8 pb-12 text-white sm:px-6 md:py-14">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0">
            <h1 className="mt-5 font-head text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
              {greeting(new Date())},{" "}
              <span className="text-brand-accent">{franchise.name}</span>
            </h1>
            <p className="mt-3 max-w-lg text-base leading-7 text-white/75">
              Register candidates who walk into {franchise.name}, follow them
              from membership to placement and watch your commission grow.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {canRegister && (
                <Button
                  className="h-11 bg-white px-6 font-head text-brand hover:bg-white/90"
                  nativeButton={false}
                  render={<Link href={FRANCHISE_REGISTER} />}
                >
                  <UserPlus className="size-4" />
                  Register a candidate
                </Button>
              )}
              <Button
                variant="outline"
                className="h-11 border-white/40 bg-transparent px-6 font-head text-white hover:bg-white/10 hover:text-white"
                nativeButton={false}
                render={<Link href={FRANCHISE_CANDIDATES} />}
              >
                <Users className="size-4" />
                Your candidates
              </Button>
            </div>

            {notice && (
              <p className="mt-5 flex max-w-lg items-start gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/90 ring-1 ring-white/15">
                <CalendarClock className="mt-0.5 size-4 flex-none text-brand-accent" />
                {notice}
              </p>
            )}
          </div>

          <FranchiseCard
            franchise={franchise}
            stats={[
              { label: "Registered", value: candidates.length },
              { label: "Active", value: active },
              { label: "Placed", value: placed },
            ]}
            outstanding={ledger.totals.outstanding}
            paid={ledger.totals.paid}
          />
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Your candidates"
            title="Latest registrations"
            href={FRANCHISE_CANDIDATES}
            linkLabel="All candidates"
          />
          {candidates.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={Users}
                title="No candidates yet"
                action={
                  canRegister && (
                    <Button
                      className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                      nativeButton={false}
                      render={<Link href={FRANCHISE_REGISTER} />}
                    >
                      Register your first candidate
                    </Button>
                  )
                }
              >
                {canRegister
                  ? "Register candidates who visit your outlet. They confirm with a code we email them and pay the membership to JobClubb."
                  : "You can't register candidates while your agreement isn't active."}
              </EmptyState>
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {candidates.slice(0, SHOWN).map((c) => (
                <CandidateCard key={c.id} candidate={c} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="border-y border-border bg-card px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Earnings"
            title="Latest commission"
            href={FRANCHISE_EARNINGS}
            linkLabel="All earnings"
          />
          {ledger.commissions.length === 0 ? (
            <div className="mt-6">
              <EmptyState icon={BadgeIndianRupee} title="No commission yet">
                Commission appears here as soon as one of your candidates pays.
              </EmptyState>
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ledger.commissions.slice(0, SHOWN).map((c) => (
                <CommissionCard key={c.id} commission={c} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow>How you earn</SectionEyebrow>
          <h2 className="mt-2 font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
            Commission on every step
          </h2>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {EARNING_POINTS.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-head font-bold tracking-tight">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {brands.length > 0 && (
        <section className="border-t border-border bg-card px-4 py-12 sm:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Show your candidates"
              title="Brands hiring through JobClubb"
              href="/companies"
              linkLabel="All companies"
            />
            <div className="mt-6">
              <RecruiterBoard logos={brands.map((brand) => brand.logo_path)} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function FranchiseCard({
  franchise,
  stats,
  outstanding,
  paid,
}: {
  franchise: CurrentFranchise;
  stats: { label: string; value: number }[];
  outstanding: number;
  paid: number;
}) {
  return (
    <aside className="min-w-0 rounded-3xl bg-card p-5 text-foreground shadow-xl sm:p-6">
      <div className="flex items-center gap-3">
        <CompanyAvatar
          name={franchise.name}
          logoUrl={null}
          className="size-12 rounded-2xl text-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-head font-bold tracking-tight">
            {franchise.name}
          </p>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3 flex-none" />
            {franchise.city}
          </p>
        </div>
        <span
          className={cn(
            "flex-none rounded-full px-2.5 py-1 font-head text-[11px] font-bold",
            FRANCHISE_STATUS_BADGES[franchise.status],
          )}
        >
          {FRANCHISE_STATUS_LABELS[franchise.status]}
        </span>
      </div>

      <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        Franchise code <CopyCode code={franchise.code} />
      </p>

      <dl className="mt-4 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col-reverse px-3 py-3 text-center"
          >
            <dt className="mt-0.5 text-[11px] text-muted-foreground">
              {label}
            </dt>
            <dd className="font-head text-2xl font-extrabold tracking-tight">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {outstanding > 0 ? (
          <>
            <span className="font-semibold text-foreground">
              {formatRupees(outstanding)}
            </span>{" "}
            commission to come · {formatRupees(paid)} paid
          </>
        ) : (
          `${formatRupees(paid)} commission paid so far`
        )}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="px-3 font-head sm:px-4"
          nativeButton={false}
          render={<Link href={FRANCHISE_EARNINGS} />}
        >
          <BadgeIndianRupee className="size-4" />
          Earnings
        </Button>
        <Button
          className="bg-brand px-3 font-head text-brand-foreground hover:bg-brand-dark sm:px-4"
          nativeButton={false}
          render={<Link href={FRANCHISE_HOME} />}
        >
          <LayoutDashboard className="size-4" />
          Dashboard
        </Button>
      </div>
    </aside>
  );
}

function CandidateCard({ candidate: c }: { candidate: FranchiseCandidate }) {
  const status =
    c.placement === "joined"
      ? { label: "Placed", className: "bg-good/12 text-good" }
      : c.membershipActive
        ? { label: "Member", className: "bg-brand/10 text-brand" }
        : { label: "Expired", className: "bg-muted text-muted-foreground" };

  return (
    <li className="flex flex-col rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-head font-bold tracking-tight">
            {c.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {industryName(c.industry)}
          </p>
        </div>
        <span
          className={cn(
            "flex-none rounded-full px-2.5 py-0.5 font-head text-[11px] font-bold",
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <MapPin className="size-3.5 text-brand" />
          {c.city}
        </li>
        <li className="flex items-center gap-1.5">
          <Briefcase className="size-3.5 text-brand" />
          {c.applications}{" "}
          {c.applications === 1 ? "application" : "applications"}
        </li>
      </ul>

      <div className="mt-auto pt-4">
        <div className="-mx-4 flex items-center gap-1.5 border-t border-border px-4 pt-3 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          Registered {formatDateOnly(todayIst(new Date(c.createdAt)))}
        </div>
      </div>
    </li>
  );
}

function CommissionCard({ commission: c }: { commission: Commission }) {
  return (
    <li className="flex flex-col rounded-2xl border border-border bg-background p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-head font-bold tracking-tight">
            {c.candidateName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {COMMISSION_KIND_LABELS[c.kind]}
          </p>
        </div>
        <span
          className={cn(
            "flex-none rounded-full px-2.5 py-0.5 font-head text-[11px] font-bold",
            COMMISSION_STATE_BADGES[c.state],
          )}
        >
          {COMMISSION_STATE_LABELS[c.state]}
        </span>
      </div>

      <div className="-mx-5 mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 pt-4 text-xs text-muted-foreground">
        <span
          className={cn(
            "font-head text-lg font-extrabold text-foreground",
            c.amount < 0 && "text-destructive",
          )}
        >
          {formatRupees(c.amount)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {c.state === "outstanding"
            ? `Due ${formatDateOnly(c.dueOn)}`
            : `Earned ${formatDateOnly(todayIst(new Date(c.earnedAt)))}`}
        </span>
      </div>
    </li>
  );
}

function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <h2 className="mt-2 font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="inline-flex flex-none items-center gap-1 font-head text-sm font-bold text-brand hover:text-brand-dark"
      >
        {linkLabel} <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
