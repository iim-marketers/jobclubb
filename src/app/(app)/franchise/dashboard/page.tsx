import Link from "next/link";
import {
  BadgeIndianRupee,
  CalendarClock,
  ChevronRight,
  UserPlus,
  Users,
} from "lucide-react";

import { CopyCode } from "@/components/copy-code";
import { Button } from "@/components/ui/button";
import {
  COMMISSION_KIND_LABELS,
  FRANCHISE_CANDIDATES,
  FRANCHISE_EARNINGS,
  FRANCHISE_REGISTER,
  daysBetween,
  lastDayOf,
} from "@/lib/franchise";
import { formatDateOnly, formatRupees, todayIst } from "@/lib/placements";
import { cn } from "@/lib/utils";
import { requireFranchise } from "@/server/franchises/current";
import { listFranchiseCandidates } from "@/server/franchises/franchises";
import { getLedger } from "@/server/franchises/ledger";

const EXPIRY_WARNING_DAYS = 30;

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "good" | "warn";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-head text-2xl font-extrabold tracking-tight",
          tone === "good" && "text-good",
          tone === "warn" && "text-amber-700 dark:text-amber-300",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default async function FranchiseOverviewPage() {
  const franchise = await requireFranchise();
  const [candidates, ledger] = await Promise.all([
    listFranchiseCandidates(franchise.id, { paidOnly: true }),
    getLedger(franchise.id),
  ]);
  const today = todayIst();
  const lastDay = lastDayOf(franchise);
  const daysLeft = daysBetween(today, lastDay);
  const active = candidates.filter((c) => c.membershipActive).length;
  const placed = candidates.filter((c) => c.placement === "joined").length;

  const banner =
    franchise.status === "upcoming"
      ? `Your agreement starts on ${formatDateOnly(franchise.startsOn)}. You can register candidates from then.`
      : franchise.status === "terminated"
        ? `Your franchise agreement was terminated, with ${formatDateOnly(lastDay)} as the last day. You can't register new candidates, but commission you've already earned will still be paid.`
        : franchise.status === "expired"
          ? `Your franchise agreement ended on ${formatDateOnly(lastDay)}. Contact JobClubb head office to renew. Commission you've already earned will still be paid.`
          : daysLeft <= EXPIRY_WARNING_DAYS
            ? `Your agreement ends on ${formatDateOnly(lastDay)} (${daysLeft} ${daysLeft === 1 ? "day" : "days"} left). Contact JobClubb head office about renewal: commission stops for payments after that date.`
            : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-head text-2xl font-extrabold tracking-tight">
            {franchise.name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            Franchise code <CopyCode code={franchise.code} />
          </p>
        </div>
        {/* {franchise.status === "active" && (
          <Button
            className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href={FRANCHISE_REGISTER} />}
          >
            <UserPlus className="size-4" />
            Register a candidate
          </Button>
        )} */}
      </div>

      {banner && (
        <p
          className={cn(
            "flex items-start gap-2 rounded-2xl px-4 py-3 text-sm",
            franchise.status === "active" || franchise.status === "upcoming"
              ? "bg-amber-500/10 text-amber-800 dark:text-amber-300"
              : "bg-destructive/10 text-destructive",
          )}
        >
          <CalendarClock className="mt-0.5 size-4 flex-none" />
          {banner}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Candidates registered" value={candidates.length} />
        <Stat
          label="Active memberships"
          value={active}
          hint={
            candidates.length > active
              ? `${candidates.length - active} expired`
              : undefined
          }
        />
        <Stat
          label="Placed"
          value={placed}
          tone={placed ? "good" : undefined}
        />
        <Stat
          label="Commission to come"
          value={formatRupees(ledger.totals.outstanding)}
          hint={`${formatRupees(ledger.totals.paid)} paid so far`}
          tone={ledger.totals.outstanding > 0 ? "warn" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 font-head font-bold">
              <Users className="size-4 text-brand" /> Latest candidates
            </h2>
            <Link
              href={FRANCHISE_CANDIDATES}
              className="flex items-center gap-0.5 font-head text-sm font-semibold text-brand hover:underline"
            >
              All <ChevronRight className="mt-1 size-4" />
            </Link>
          </div>
          {candidates.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No candidates yet.{" "}
              {franchise.status === "active" && (
                <Link
                  href={FRANCHISE_REGISTER}
                  className="font-semibold text-brand hover:underline"
                >
                  Register your first candidate
                </Link>
              )}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {candidates.slice(0, 3).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-head text-sm font-bold">
                      {c.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Registered{" "}
                      {formatDateOnly(todayIst(new Date(c.createdAt)))}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex-none text-xs font-semibold",
                      c.membershipActive || c.placement === "joined"
                        ? "text-good"
                        : "text-muted-foreground",
                    )}
                  >
                    {c.placement === "joined"
                      ? "Placed"
                      : c.membershipActive
                        ? "Paid"
                        : "Expired"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 font-head font-bold">
              <BadgeIndianRupee className="size-4 text-brand" /> Latest
              commission
            </h2>
            <Link
              href={FRANCHISE_EARNINGS}
              className="flex items-center gap-0.5 font-head text-sm font-semibold text-brand hover:underline"
            >
              Earnings <ChevronRight className="size-4 mt-1" />
            </Link>
          </div>
          {ledger.commissions.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Commission appears here as soon as one of your candidates pays.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {ledger.commissions.slice(0, 3).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-head text-sm font-bold">
                      {c.candidateName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {COMMISSION_KIND_LABELS[c.kind]}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex-none font-head text-sm font-bold",
                      c.amount < 0 && "text-destructive",
                    )}
                  >
                    {formatRupees(c.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-head font-bold">How you earn</h2>
        <ul className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <li className="rounded-xl bg-muted/50 p-4">
            <p className="font-head font-bold">₹749.50 per candidate</p>
            <p className="mt-1 leading-6 text-muted-foreground">
              Half of the ₹1,499 membership, when a candidate you registered
              pays for their first year.
            </p>
          </li>
          <li className="rounded-xl bg-muted/50 p-4">
            <p className="font-head font-bold">50% of the placement fee</p>
            <p className="mt-1 leading-6 text-muted-foreground">
              When they&apos;re placed and pay JobClubb one month&apos;s salary,
              you get half of what they pay.
            </p>
          </li>
          <li className="rounded-xl bg-muted/50 p-4">
            <p className="font-head font-bold">Paid in 2 working days</p>
            <p className="mt-1 leading-6 text-muted-foreground">
              By bank transfer, once a membership is paid from your dashboard
              or JobClubb receives a placement fee.
            </p>
          </li>
        </ul>
      </section>
    </div>
  );
}
