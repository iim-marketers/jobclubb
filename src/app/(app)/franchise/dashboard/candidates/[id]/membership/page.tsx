import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeIndianRupee,
  Briefcase,
  CalendarClock,
  CalendarDays,
  CircleCheck,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";

import { CollectMembership } from "@/components/franchise/franchise-ui";
import { Badge } from "@/components/ui/badge";
import {
  FRANCHISE_CANDIDATES,
  FRANCHISE_STATUS_LABELS,
  PAYOUT_WORKING_DAYS,
} from "@/lib/franchise";
import {
  CHECKOUT_PLAN,
  PLAN_DETAILS,
  isMembershipActive,
} from "@/lib/membership";
import { formatDateOnly, formatRupees, todayIst } from "@/lib/placements";
import { INDUSTRIES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { requireFranchise } from "@/server/franchises/current";
import { getFranchiseCandidate } from "@/server/franchises/membership";

export const metadata = { title: "Collect membership — JobClubb franchise" };

export default async function CollectMembershipPage({
  params,
}: PageProps<"/franchise/dashboard/candidates/[id]/membership">) {
  const { id } = await params;
  const franchise = await requireFranchise(
    `${FRANCHISE_CANDIDATES}/${id}/membership`,
  );
  const candidate = await getFranchiseCandidate(franchise.id, id);
  if (!candidate) notFound();

  const name = `${candidate.first_name} ${candidate.last_name}`;
  const initials =
    `${candidate.first_name[0] ?? ""}${candidate.last_name[0] ?? ""}`.toUpperCase();
  const expiresAt = candidate.membership_expires_at;
  const active = isMembershipActive(expiresAt);
  const renewal = !!expiresAt;

  const details: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Mail, label: "Email", value: candidate.email },
    { icon: Phone, label: "Mobile", value: candidate.phone },
    { icon: MapPin, label: "City", value: `${candidate.city} ${candidate.pincode}` },
    {
      icon: Briefcase,
      label: "Preferred industry",
      value: INDUSTRIES.find((i) => i.slug === candidate.industry)?.name ?? "—",
    },
    {
      icon: CalendarDays,
      label: "Registered",
      value: formatDateOnly(todayIst(new Date(candidate.created_at))),
    },
    {
      icon: CalendarClock,
      label: renewal ? (active ? "Membership until" : "Membership ended") : "Membership",
      value: expiresAt
        ? formatDateOnly(todayIst(new Date(expiresAt)))
        : `${PLAN_DETAILS[CHECKOUT_PLAN].price} due now`,
    },
  ];

  const afterPayment: { icon: LucideIcon; title: string; body: string }[] = [
    {
      icon: CircleCheck,
      title: "Active right away",
      body: `${candidate.first_name} can sign in and apply for jobs straight after, for a full year.`,
    },
    {
      icon: ReceiptText,
      title: "Receipt by email",
      body: `We email the GST invoice, in ${candidate.first_name}'s name, to ${candidate.email}.`,
    },
    ...(renewal
      ? []
      : [
          {
            icon: BadgeIndianRupee,
            title: `${formatRupees((PLAN_DETAILS[CHECKOUT_PLAN].amount * 100) / 2)} to you`,
            body: `Your commission shows on Earnings and reaches your bank within ${PAYOUT_WORKING_DAYS} working days.`,
          },
        ]),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href={FRANCHISE_CANDIDATES}
          className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Candidates
        </Link>
        <h1 className="mt-2 font-head text-2xl font-extrabold tracking-tight">
          {renewal && !active ? "Renew membership" : "Collect membership"}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {renewal
            ? `Renew ${candidate.first_name}'s membership here, or they can renew it on their own account.`
            : `Pay ${candidate.first_name}'s membership online here, with your own UPI or card or theirs. You earn half as soon as it's paid.`}
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="h-20 bg-linear-to-br from-brand/15 via-brand/5 to-transparent" />
            <div className="-mt-10 px-5 pb-5 sm:px-6 sm:pb-6">
              <span className="flex size-20 items-center justify-center rounded-2xl border-4 border-card bg-brand font-head text-2xl font-extrabold text-brand-foreground shadow-sm">
                {initials}
              </span>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <h2 className="min-w-0 truncate font-head text-xl font-extrabold tracking-tight">
                  {name}
                </h2>
                <Badge
                  className={cn(
                    "font-head font-bold",
                    active
                      ? "bg-good/12 text-good"
                      : renewal
                        ? "bg-muted text-muted-foreground"
                        : "bg-amber-500/12 text-amber-700 dark:text-amber-300",
                  )}
                >
                  {active ? "Paid" : renewal ? "Expired" : "Not paid yet"}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Registered by {franchise.name}
              </p>

              <dl className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {details.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex min-w-0 items-center gap-3 rounded-2xl bg-muted/50 px-3.5 py-3"
                  >
                    <Icon className="size-4 flex-none text-muted-foreground" />
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="truncate text-sm font-semibold" title={value}>
                        {value}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {!active && (
            <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
              <h2 className="font-head font-bold tracking-tight">
                Once it&apos;s paid
              </h2>
              <ol className="mt-5">
                {afterPayment.map(({ icon: Icon, title, body }, i) => (
                  <li key={title} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < afterPayment.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute top-10 bottom-1 left-[1.1875rem] w-px bg-border"
                      />
                    )}
                    <span className="relative flex size-10 flex-none items-center justify-center rounded-full bg-brand/10 text-brand ring-4 ring-card">
                      <Icon className="size-4.5" />
                    </span>
                    <div className="min-w-0 pt-1.5">
                      <p className="font-head text-sm font-bold">{title}</p>
                      <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                        {body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <div className="lg:sticky lg:top-6">
          {active ? (
            <div className="rounded-3xl border border-border bg-card p-6 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-good/12 text-good">
                <CircleCheck className="size-6" />
              </span>
              <p className="mt-4 font-head font-bold">Membership is active</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Valid until{" "}
                {formatDateOnly(todayIst(new Date(expiresAt as string)))}.
              </p>
            </div>
          ) : franchise.status === "active" ? (
            <CollectMembership
              candidate={{
                id: candidate.id,
                name,
                email: candidate.email,
                phone: candidate.phone,
              }}
              commission={!renewal}
            />
          ) : (
            <p className="flex items-start gap-2 rounded-3xl bg-amber-500/10 p-5 text-sm text-amber-800 dark:text-amber-300">
              <CalendarClock className="mt-0.5 size-4 flex-none" />
              Your franchise is{" "}
              {FRANCHISE_STATUS_LABELS[franchise.status].toLowerCase()}, so you
              can&apos;t collect memberships. {candidate.first_name} can pay on
              their own account.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
