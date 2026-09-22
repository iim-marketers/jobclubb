import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { MembershipPlan } from "@/lib/membership";

export async function chooseMembershipPlan(
  supabase: SupabaseClient,
  candidateId: string,
  plan: MembershipPlan,
) {
  const { error } = await supabase
    .from("candidates")
    .update({ membership_plan: plan })
    .eq("id", candidateId);

  if (error) console.error("Saving membership plan failed", error);
  return !error;
}
