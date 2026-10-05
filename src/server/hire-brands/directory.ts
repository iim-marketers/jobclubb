import "server-only";

import { createClient } from "@/lib/supabase/server";

export const HIRE_BRAND_SECTORS = [
  { value: "Airlines", label: "Airlines" },
  { value: "Hotels", label: "Hotels" },
  { value: "Cruise Lines", label: "Cruise Lines" },
  { value: "Airport & Travel Services", label: "Airport & Travel Services" },
  { value: "Other", label: "Other employers" },
] as const;

export type HireBrand = { id: string; name: string; sector: string; logo_path: string };

export async function getHireBrands(): Promise<HireBrand[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hire_brands")
    .select("id, name, sector, logo_path")
    .order("name");

  if (error) throw error;
  return data;
}
