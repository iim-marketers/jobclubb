import Link from "next/link";
import { UserPlus, Users } from "lucide-react";

import { FranchiseCandidatesList } from "@/components/franchise/franchise-ui";
import { Button } from "@/components/ui/button";
import { FRANCHISE_CANDIDATES, FRANCHISE_REGISTER } from "@/lib/franchise";
import { requireFranchise } from "@/server/franchises/current";
import { listFranchiseCandidates } from "@/server/franchises/franchises";

export const metadata = { title: "Candidates — JobClubb franchise" };

export default async function FranchiseCandidatesPage() {
  const franchise = await requireFranchise(FRANCHISE_CANDIDATES);
  const candidates = await listFranchiseCandidates(franchise.id);
  const canRegister = franchise.status === "active";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-head text-2xl font-extrabold tracking-tight">
            Candidates
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Everyone you&apos;ve registered. Collect the membership for anyone
            who hasn&apos;t paid yet when they&apos;re with you.
          </p>
        </div>
        {/* {canRegister && (
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

      {candidates.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-4 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Users className="size-5" />
          </span>
          <p className="mt-4 font-head font-bold">No candidates yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {canRegister
              ? "Register candidates who visit your outlet. They confirm with a code we email them, choose a password, and pay the membership to JobClubb here."
              : "You can't register candidates while your agreement isn't active."}
          </p>
          {canRegister && (
            <Button
              className="mt-5 bg-brand font-head text-brand-foreground hover:bg-brand-dark"
              nativeButton={false}
              render={<Link href={FRANCHISE_REGISTER} />}
            >
              Register your first candidate
            </Button>
          )}
        </div>
      ) : (
        <FranchiseCandidatesList
          candidates={candidates}
          canCollect={canRegister}
        />
      )}
    </div>
  );
}
