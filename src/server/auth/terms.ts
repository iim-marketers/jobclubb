import "server-only";

import { EMPLOYER_TERMS_VERSION, TERMS_VERSION } from "@/lib/terms-content";
import { createAdminClient } from "@/lib/supabase/server";

type Account = "candidates" | "companies";

const currentVersion = (account: Account) =>
  account === "companies" ? EMPLOYER_TERMS_VERSION : TERMS_VERSION;

export async function hasAcceptedCurrentTerms(account: Account, id: string) {
  const { data, error } = await createAdminClient()
    .from(account)
    .select("terms_version")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data.terms_version === currentVersion(account);
}

export async function acceptCurrentTerms(account: Account, id: string) {
  const { error } = await createAdminClient()
    .from(account)
    .update({ terms_version: currentVersion(account), terms_accepted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
