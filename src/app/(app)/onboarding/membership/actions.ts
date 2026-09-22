"use server";

import { redirect } from "next/navigation";

import { isMembershipActive, planFor } from "@/lib/membership";
import {
  CHECKOUT_PATH,
  requireCandidate,
} from "@/server/auth/current-candidate";
import {
  activateMembership,
  paymentsTestMode,
} from "@/server/candidates/membership";

export async function payForMembership() {
  const candidate = await requireCandidate(CHECKOUT_PATH);
  if (isMembershipActive(candidate.membership_expires_at))
    redirect("/candidate/dashboard");
  if (!paymentsTestMode) redirect(`${CHECKOUT_PATH}?error=unavailable`);

  const activated = await activateMembership(
    candidate.id,
    planFor(candidate.code),
  );
  if (!activated) redirect(`${CHECKOUT_PATH}?error=failed`);

  redirect("/candidate/dashboard");
}
