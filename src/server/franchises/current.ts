import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { FRANCHISE_HOME, franchiseStatus } from "@/lib/franchise";
import { createClient } from "@/lib/supabase/server";
import { FRANCHISE_COLUMNS, isApproved, toFranchise } from "@/server/franchises/franchises";

export const getCurrentFranchise = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;

  const { data: row, error } = await supabase
    .from("franchises")
    .select(FRANCHISE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error) console.error("Loading franchise failed", error);
  if (!row) return null;

  // Pending and rejected sign-ups have no dashboard; sign-in already turns them away.
  const franchise = toFranchise(row as Parameters<typeof toFranchise>[0]);
  if (!isApproved(franchise)) return null;
  return { ...franchise, status: franchiseStatus(franchise) };
});

// Token-only check for showing signed-in UI on public pages.
export const getFranchiseSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const meta = data?.claims.user_metadata;
  if (!data?.claims.sub || meta?.role !== "franchise") return null;
  return { name: String(meta.name ?? "Franchise"), email: String(data.claims.email ?? "") };
});

export type CurrentFranchise = NonNullable<Awaited<ReturnType<typeof getCurrentFranchise>>>;

export async function redirectIfFranchise() {
  if (await getCurrentFranchise()) redirect(FRANCHISE_HOME);
}

export async function requireFranchise(returnTo: string = FRANCHISE_HOME) {
  const franchise = await getCurrentFranchise();
  if (!franchise) redirect(`/sign-in?as=franchise&next=${encodeURIComponent(returnTo)}`);
  return franchise;
}
