import "server-only";

import { franchiseStatus } from "@/lib/franchise";
import { createAdminClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

export type CollectableCandidate = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  pincode: string;
  membership_expires_at: string | null;
};

export async function getFranchiseCandidate(franchiseId: string, candidateId: string) {
  if (!UUID.test(candidateId)) return null;
  const { data, error } = await createAdminClient()
    .from("candidates")
    .select("id, first_name, last_name, email, phone, city, pincode, membership_expires_at")
    .eq("id", candidateId)
    .eq("franchise_id", franchiseId)
    .maybeSingle();
  if (error) throw error;
  return data as CollectableCandidate | null;
}

export type CollectingFranchise = { name: string; phone: string; outletAddress: string };

// A franchise candidate's first membership is collected by their franchise, on
// its dashboard, while the agreement is in force. Renewals, and candidates of a
// franchise whose agreement has ended, pay on their own.
export async function franchiseCollecting(candidate: {
  franchise_id: string | null;
  membership_expires_at: string | null;
}): Promise<CollectingFranchise | null> {
  if (!candidate.franchise_id || candidate.membership_expires_at) return null;
  const { data, error } = await createAdminClient()
    .from("franchises")
    .select("name, phone, outlet_address, starts_on, ends_on, terminated_on")
    .eq("id", candidate.franchise_id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const status = franchiseStatus({
    startsOn: data.starts_on,
    endsOn: data.ends_on,
    terminatedOn: data.terminated_on,
  });
  return status === "active"
    ? { name: data.name, phone: data.phone, outletAddress: data.outlet_address }
    : null;
}
