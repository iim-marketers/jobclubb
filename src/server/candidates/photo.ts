import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

const BUCKET = "candidate-photos";
const SIGNED_URL_TTL = 60 * 60;

export const PHOTO_MAX_BYTES = 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
};

export function isAcceptedPhoto(file: unknown): file is File {
  return (
    file instanceof File &&
    file.type in EXTENSIONS &&
    file.size > 0 &&
    file.size <= PHOTO_MAX_BYTES
  );
}

// A fresh filename per upload, so a replaced photo is never served from a stale CDN cache.
export async function uploadCandidatePhoto(candidateId: string, file: File) {
  const path = `${candidateId}/${Date.now()}.${EXTENSIONS[file.type]}`;
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

export async function deleteCandidatePhoto(path: string) {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error("Deleting candidate photo failed", error);
}

export const getCandidatePhotoUrl = cache(
  async (path: string | null): Promise<string | null> => {
    if (!path) return null;
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (error) {
      console.error("Signing candidate photo URL failed", error);
      return null;
    }
    return data.signedUrl;
  },
);
