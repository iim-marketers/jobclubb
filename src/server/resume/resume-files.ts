import "server-only";

import { createAdminClient } from "@/lib/supabase/server";

const BUCKET = "candidate-resumes";

// A fresh filename per upload, so a replaced PDF is never served from a stale CDN cache.
export async function uploadResumePdf(
  candidateId: string,
  kind: "uploaded" | "generated",
  pdf: Blob | Uint8Array,
) {
  const path = `${candidateId}/${kind}-${Date.now()}.pdf`;
  const { error } = await createAdminClient()
    .storage.from(BUCKET)
    .upload(path, pdf, { contentType: "application/pdf" });
  if (error) throw error;
  return path;
}

export async function deleteResumePdfs(paths: (string | null | undefined)[]) {
  const existing = paths.filter((p): p is string => !!p);
  if (existing.length === 0) return;
  const { error } = await createAdminClient().storage.from(BUCKET).remove(existing);
  if (error) console.error("Deleting resume PDFs failed", error);
}
