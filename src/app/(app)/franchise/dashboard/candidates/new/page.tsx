import Link from "next/link";
import { ArrowLeft, CalendarClock } from "lucide-react";

import { RegisterCandidateForm } from "@/components/franchise/franchise-ui";
import {
  FRANCHISE_CANDIDATES,
  FRANCHISE_REGISTER,
  FRANCHISE_STATUS_LABELS,
} from "@/lib/franchise";
import { formatDateOnly } from "@/lib/placements";
import { requireFranchise } from "@/server/franchises/current";

export const metadata = { title: "Register a candidate — JobClubb franchise" };

export default async function RegisterCandidatePage() {
  const franchise = await requireFranchise(FRANCHISE_REGISTER);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href={FRANCHISE_CANDIDATES}
          className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Candidates
        </Link>
        <h1 className="mt-2 font-head text-2xl font-extrabold tracking-tight">
          Register a candidate
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in their details with them. We email them a code to confirm their
          email, and their account is created once you enter it. Each person can
          only be registered once.
        </p>
      </div>

      {franchise.status === "active" ? (
        <RegisterCandidateForm franchiseName={franchise.name} />
      ) : (
        <p className="flex items-start gap-2 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CalendarClock className="mt-0.5 size-4 flex-none" />
          {franchise.status === "upcoming"
            ? `Your agreement starts on ${formatDateOnly(franchise.startsOn)}. You can register candidates from then.`
            : `Your franchise is ${FRANCHISE_STATUS_LABELS[franchise.status].toLowerCase()}, so you can't register candidates. Contact JobClubb head office at support@jobclubb.com.`}
        </p>
      )}
    </div>
  );
}
