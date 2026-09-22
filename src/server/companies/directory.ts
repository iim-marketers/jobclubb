import "server-only";

import { createClient } from "@/lib/supabase/server";

export const COMPANY_SECTORS = [
  { value: "Airlines", label: "Airlines" },
  { value: "Hotels", label: "Hotels" },
  { value: "Cruise Lines", label: "Cruise Lines" },
  { value: "Airport & Travel Services", label: "Airport & Travel Services" },
  { value: "Other", label: "Other employers" },
] as const;

export type Company = { id: string; name: string; sector: string; logo_path: string };

export async function getCompanies(): Promise<Company[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, sector, logo_path")
    .order("name");

  if (error) throw error;
  return data;
}
