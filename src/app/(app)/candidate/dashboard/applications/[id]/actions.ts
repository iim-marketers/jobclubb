"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { getCurrentCandidate } from "@/server/auth/current-candidate";
import { sendOfferDeclined } from "@/server/placements/emails";
import { declinePlacement } from "@/server/placements/placements";

export async function declineOffer(placementId: string): Promise<{ error?: string }> {
  const candidate = await getCurrentCandidate();
  if (!candidate) return { error: "Please sign in again." };
  try {
    if (!(await declinePlacement(placementId, { candidateId: candidate.id })))
      return { error: "This offer has already changed. Refresh to see the latest." };
  } catch (error) {
    console.error("Declining offer failed", error);
    return { error: "We couldn't record that. Please try again." };
  }
  after(() => sendOfferDeclined(placementId));
  revalidatePath(CANDIDATE_HOME, "layout");
  return {};
}
