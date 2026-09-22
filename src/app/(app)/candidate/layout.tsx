import { cookies } from "next/headers";

import {
  CandidateShell,
  SIDEBAR_COOKIE,
} from "@/components/candidate/candidate-shell";
import type { CandidateProfile } from "@/components/candidate/candidate-sidebar";
import { VERTICALS } from "@/lib/taxonomy";
import { requireCandidateWithPlan } from "@/server/auth/current-candidate";

export default async function CandidateLayout({
  children,
}: LayoutProps<"/candidate">) {
  const candidate = await requireCandidateWithPlan("/candidate/dashboard");
  const collapsed =
    (await cookies()).get(SIDEBAR_COOKIE)?.value === "collapsed";

  const profile: CandidateProfile = {
    firstName: candidate.first_name,
    lastName: candidate.last_name,
    email: candidate.email,
    sector: VERTICALS.find((v) => v.slug === candidate.vertical)?.name,
    plan: candidate.membership_plan,
  };

  return (
    <CandidateShell candidate={profile} defaultCollapsed={collapsed}>
      <main className="flex-1 px-4 py-4 pb-10 sm:px-6">
        <div className="mx-auto w-full max-w-384">{children}</div>
      </main>
    </CandidateShell>
  );
}
