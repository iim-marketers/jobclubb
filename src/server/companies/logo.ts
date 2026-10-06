import "server-only";

import { createClient } from "@/lib/supabase/server";

export { isAcceptedPhoto as isAcceptedLogo } from "@/server/candidates/photo";

const BUCKET = "company-logos";
const EXTENSIONS: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
};

// A fresh filename per upload, so a replaced logo is never served from a stale CDN cache.
export async function uploadCompanyLogo(companyId: string, file: File) {
  const path = `${companyId}/${Date.now()}.${EXTENSIONS[file.type]}`;
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

export async function deleteCompanyLogo(path: string) {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error("Deleting company logo failed", error);
}

export function getCompanyLogoUrl(path: string | null) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}
