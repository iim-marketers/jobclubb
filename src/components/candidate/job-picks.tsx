import Link from "next/link";
import { ArrowRight, Briefcase, Clock, MapPin, Sparkles } from "lucide-react";

import { CompanyAvatar } from "@/components/company-avatar";
import type { JobListing } from "@/lib/jobs-data";
import { richTextToPlain } from "@/lib/rich-text";

const RECOMMENDED = 6;

type Pick = { job: JobListing; reasons: string[] };

// matches counts jobs in the candidate's sector, for the "N roles match" line.
export type JobPicks = {
  matched: boolean;
  nearby: boolean;
  matches: number;
  items: Pick[];
};

// The first three pincode digits mark the sorting district, which keeps a
// suburb like Bidhannagar (700091) matched with Kolkata (700001).
const sameArea = (a: string, b: string) => a.slice(0, 3) === b.slice(0, 3);

export function recommendJobs(
  jobs: JobListing[],
  profile: { sector?: string; city: string; pincode: string; roles: string[] },
): JobPicks {
  const roles = profile.roles.map((r) => r.toLowerCase());
  const city = profile.city.toLowerCase();
  const scored = jobs.map((job) => {
    const title = `${job.title} ${job.designation}`.toLowerCase();
    const reasons: string[] = [];
    let score = 0;
    if (job.industry === profile.sector) {
      score += 4;
      reasons.push("Your sector");
    }
    if (roles.some((r) => title.includes(r))) {
      score += 3;
      reasons.push("Preferred role");
    }
    // Properties hire locally, so a nearby job in the candidate's sector
    // outranks a role match in another city.
    const inCity = !!city && job.location.toLowerCase() === city;
    const near = inCity || (!!profile.pincode && sameArea(job.pincode, profile.pincode));
    if (near) {
      score += 4;
      reasons.push(inCity ? "In your city" : "Near you");
    }
    return { job, reasons, score, near };
  });
  const ranked = scored.toSorted((a, b) => b.score - a.score);
  const items = ranked.slice(0, RECOMMENDED);
  return {
    matched: ranked.some((r) => r.score > 0),
    nearby: items.some((r) => r.near),
    matches: jobs.filter((job) => job.industry === profile.sector).length,
    items,
  };
}

export function NoNearbyNote({ city }: { city: string }) {
  return (
    <p className="flex items-start gap-2.5 rounded-xl bg-muted/60 px-4 py-3 text-sm leading-6 text-muted-foreground">
      <MapPin className="mt-1 size-4 flex-none text-brand" />
      <span>
        <span className="font-semibold text-foreground">
          No openings near {city} yet.
        </span>{" "}
        Here are the best matches for your profile from other cities.
      </span>
    </p>
  );
}

export function JobPicksGrid({ picks }: { picks: JobPicks }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <TopMatch pick={picks.items[0]} matched={picks.matched} />
      {picks.items.length > 1 && (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {picks.items.slice(1, 4).map((pick) => (
            <PickRow key={pick.job.slug} pick={pick} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function JobPicksList({ picks }: { picks: JobPicks }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {picks.items.map(({ job }) => (
        <li
          key={job.slug}
          className="group relative rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand/40"
        >
          <div className="flex items-center gap-3">
            <CompanyAvatar
              name={job.company}
              logoUrl={job.companyLogoUrl}
              className="size-10"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/jobs/${job.slug}`}
                className="block truncate font-head text-sm font-bold after:absolute after:inset-0 after:rounded-2xl group-hover:text-brand"
              >
                {job.title}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {job.company} · {job.location}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-head text-sm font-bold">{job.salaryRange}</span>
            <span className="flex-none text-muted-foreground">{job.postedAgo}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function TopMatch({ pick, matched }: { pick: Pick; matched: boolean }) {
  const { job } = pick;
  const meta = [
    { icon: MapPin, value: job.location },
    { icon: Briefcase, value: job.experience },
    { icon: Clock, value: `${job.workMode} · ${job.jobType}` },
  ];

  return (
    <article className="group relative flex flex-col rounded-2xl border-2 border-brand bg-linear-to-br from-brand/6 to-card p-5 shadow-md shadow-brand/10 transition-shadow hover:shadow-lg hover:shadow-brand/20">
      <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 font-head text-[11px] font-bold text-brand-foreground shadow-sm">
        <Sparkles className="size-3.5" />
        {matched ? "Best match" : "Newest"}
      </span>

      <div className="flex items-start gap-4">
        <CompanyAvatar
          name={job.company}
          logoUrl={job.companyLogoUrl}
          className="size-14 rounded-2xl"
        />
        <div className="min-w-0">
          <h3 className="font-head text-xl leading-snug font-extrabold tracking-tight">
            <Link
              href={`/jobs/${job.slug}`}
              className="after:absolute after:inset-0 after:rounded-2xl group-hover:text-brand"
            >
              {job.title}
            </Link>
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {job.company} · {job.postedAgo}
          </p>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {richTextToPlain(job.description)}
      </p>

      <ul className="my-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {meta.map(({ icon: Icon, value }) => (
          <li key={value} className="flex items-center gap-1.5">
            <Icon className="size-4 flex-none text-brand" />
            {value}
          </li>
        ))}
      </ul>

      {pick.reasons.length > 0 && (
        <ul className="mb-4 flex flex-wrap gap-1.5">
          {pick.reasons.map((reason) => (
            <li
              key={reason}
              className="rounded-full bg-good/12 px-2.5 py-1 font-head text-[11px] font-bold text-good"
            >
              ✓ {reason}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto -mx-5 flex flex-wrap items-end justify-between gap-3 border-t border-border px-5 pt-4">
        <div>
          <p className="text-xs text-muted-foreground">Salary</p>
          <p className="font-head text-lg font-extrabold">{job.salaryRange}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 font-head text-sm font-bold text-brand-foreground transition-colors group-hover:bg-brand-dark">
          View & apply
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}

function PickRow({ pick }: { pick: Pick }) {
  const { job } = pick;
  return (
    <li className="group relative flex flex-1 items-center gap-3 p-4 transition-colors hover:bg-muted/50 sm:gap-4">
      <CompanyAvatar
        name={job.company}
        logoUrl={job.companyLogoUrl}
        className="size-11 rounded-xl"
      />
      <div className="min-w-0 flex-1">
        <Link
          href={`/jobs/${job.slug}`}
          className="block truncate font-head font-bold tracking-tight after:absolute after:inset-0 group-hover:text-brand"
        >
          {job.title}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {job.company} · {job.location} · {job.postedAgo}
        </p>
      </div>
      <div className="hidden flex-none text-right sm:block">
        <p className="font-head text-sm font-bold">{job.salaryRange}</p>
        {pick.reasons[0] && (
          <p className="text-[11px] font-semibold text-good">
            {pick.reasons[0]}
          </p>
        )}
      </div>
      <ArrowRight className="size-4 flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
    </li>
  );
}
