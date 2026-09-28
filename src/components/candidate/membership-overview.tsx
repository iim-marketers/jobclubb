import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MEMBERSHIP_DAYS } from "@/lib/membership";
import { cn } from "@/lib/utils";

export const RENEW_WINDOW_DAYS = 30;

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);

const formatValidThru = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    month: "2-digit",
    year: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(d);

export function MembershipOverview({
  name,
  planName,
  franchise,
  price,
  code,
  startedAt,
  expiresAt,
  daysLeft,
}: {
  name: string;
  planName: string;
  franchise: boolean;
  price: string;
  code: string | null;
  startedAt: Date;
  expiresAt: Date;
  daysLeft: number;
}) {
  const renewSoon = daysLeft <= RENEW_WINDOW_DAYS;

  return (
    <section
      aria-label="Your plan"
      className="grid gap-6 rounded-3xl border border-border bg-card p-5 sm:p-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-8"
    >
      <MemberCard
        name={name}
        franchise={franchise}
        code={code}
        expiresAt={expiresAt}
      />

      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-head text-xl font-extrabold tracking-tight sm:text-2xl">
              {planName}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {price} · {MEMBERSHIP_DAYS}-day plan
            </p>
          </div>
          <span className="inline-flex flex-none items-center gap-1 rounded-full bg-good/12 px-2.5 py-1 font-head text-xs font-bold text-good">
            <BadgeCheck className="size-3.5" /> Active
          </span>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          <Stat
            label="Days left"
            value={daysLeft}
            warn={renewSoon}
            className="col-span-2 sm:col-span-1"
          />
          <Stat label="Member since" value={formatDate(startedAt)} />
          <Stat label="Valid till" value={formatDate(expiresAt)} />
        </dl>

        <div
          className={cn(
            "mt-3 flex flex-wrap items-center gap-3 rounded-2xl p-4",
            renewSoon ? "bg-amber-50 dark:bg-amber-500/10" : "bg-muted/60",
          )}
        >
          <span
            className={cn(
              "flex size-9 flex-none items-center justify-center rounded-xl",
              renewSoon
                ? "bg-amber-500/15 text-amber-600"
                : "bg-card text-muted-foreground",
            )}
          >
            <CalendarClock className="size-4.5" />
          </span>
          <p className="min-w-0 flex-1 basis-48 text-sm leading-6 text-muted-foreground">
            {renewSoon ? (
              <>
                <span className="font-semibold text-foreground">
                  Your plan ends soon.
                </span>{" "}
                Renew now so your applications and interviews aren&apos;t
                interrupted.
              </>
            ) : (
              `Renewal opens ${RENEW_WINDOW_DAYS} days before your plan ends. We'll email you a reminder.`
            )}
          </p>
          {renewSoon && (
            <Button
              className="w-full bg-brand sm:w-auto sm:flex-none font-head text-brand-foreground hover:bg-brand-dark"
              nativeButton={false}
              render={<Link href="/membership" />}
            >
              Renew <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function MemberCard({
  name,
  franchise,
  code,
  expiresAt,
}: {
  name: string;
  franchise: boolean;
  code: string | null;
  expiresAt: Date;
}) {
  return (
    <div className="relative mx-auto aspect-[1.586] w-full max-w-sm overflow-hidden rounded-2xl bg-linear-to-br from-brand-surface via-brand-dark to-[#023c52] p-5 text-white shadow-xl shadow-brand/20 sm:p-6 lg:mx-0">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full border-[28px] border-white/6"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -bottom-24 size-56 rounded-full bg-brand-accent/35 blur-2xl"
      />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <Image
            src="/brand/jobclubb-logo-dark.png"
            alt="JobClubb"
            width={110}
            height={20}
            className="object-contain"
          />
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-head text-[10px] font-bold tracking-[0.14em] uppercase">
            {franchise ? "Franchise" : "Member"}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4">
          <div className="min-w-0">
            {code && (
              <p className="font-mono text-xs tracking-[0.2em] text-white/70">
                {code}
              </p>
            )}
            <p className="mt-1 truncate font-head text-sm font-bold tracking-[0.12em] uppercase sm:text-base">
              {name}
            </p>
          </div>
          <div className="flex-none text-right">
            <p className="text-[9px] tracking-[0.14em] text-white/60 uppercase">
              Valid thru
            </p>
            <p className="font-mono text-sm font-semibold">
              {formatValidThru(expiresAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
  className,
}: {
  label: string;
  value: React.ReactNode;
  warn?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 bg-card px-4 py-3", className)}>
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 truncate font-head text-sm font-bold sm:text-base",
          warn && "text-amber-600",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
