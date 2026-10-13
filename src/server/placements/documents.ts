import "server-only";

import { randomUUID } from "node:crypto";

import { MAX_OFFER_FILES, MAX_OFFER_UPLOAD_BYTES, OFFER_FILE_TYPES } from "@/lib/placements";
import { createAdminClient } from "@/lib/supabase/server";

const BUCKET = "placement-documents";
const SIGNED_URL_TTL = 10 * 60;

export type PlacementDocument = {
  id: string;
  name: string;
  size: number;
  uploadedBy: "company" | "admin";
  createdAt: string;
  url: string | null;
};

export function offerFiles(formData: FormData) {
  return formData
    .getAll("documents")
    .filter((f): f is File => f instanceof File && f.size > 0);
}

export function offerFilesError(files: File[], existing = 0) {
  if (files.length + existing > MAX_OFFER_FILES)
    return `Attach up to ${MAX_OFFER_FILES} files.`;
  if (files.some((f) => !OFFER_FILE_TYPES.includes(f.type)))
    return "Attach PDF, JPG or PNG files.";
  if (files.reduce((total, f) => total + f.size, 0) > MAX_OFFER_UPLOAD_BYTES)
    return "Keep each upload to 5 MB in total. You can add more files afterwards.";
}

const safeName = (name: string) =>
  name.replace(/[^\w.\- ]+/g, "").replace(/\s+/g, "-").slice(-120) || "document";

export async function storeOfferDocuments(
  placementId: string,
  files: File[],
  uploadedBy: "company" | "admin",
) {
  const admin = createAdminClient();
  const stored: string[] = [];
  try {
    for (const file of files) {
      const path = `${placementId}/${randomUUID()}-${safeName(file.name)}`;
      const { error } = await admin.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type });
      if (error) throw error;
      stored.push(path);
      const { error: rowError } = await admin.from("placement_documents").insert({
        placement_id: placementId,
        path,
        name: file.name.slice(0, 200) || "Document",
        size: file.size,
        content_type: file.type,
        uploaded_by: uploadedBy,
      });
      if (rowError) throw rowError;
    }
  } catch (error) {
    await removeOfferDocuments(stored);
    throw error;
  }
  return stored;
}

export async function removeOfferDocuments(paths: string[]) {
  if (paths.length === 0) return;
  const admin = createAdminClient();
  await admin.from("placement_documents").delete().in("path", paths);
  await admin.storage.from(BUCKET).remove(paths);
}

export async function listOfferDocuments(
  placementId: string,
  { signed }: { signed: boolean },
): Promise<PlacementDocument[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("placement_documents")
    .select("id, path, name, size, uploaded_by, created_at")
    .eq("placement_id", placementId)
    .order("created_at");
  if (error) throw error;

  const urls = new Map<string, string>();
  if (signed && data.length > 0) {
    const { data: links } = await admin.storage
      .from(BUCKET)
      .createSignedUrls(
        data.map((d) => d.path),
        SIGNED_URL_TTL,
        { download: true },
      );
    links?.forEach((l) => l.path && l.signedUrl && urls.set(l.path, l.signedUrl));
  }

  return data.map((d) => ({
    id: d.id,
    name: d.name,
    size: d.size,
    uploadedBy: d.uploaded_by,
    createdAt: d.created_at,
    url: urls.get(d.path) ?? null,
  }));
}

export async function countOfferDocuments(placementId: string) {
  const { count, error } = await createAdminClient()
    .from("placement_documents")
    .select("id", { count: "exact", head: true })
    .eq("placement_id", placementId);
  if (error) throw error;
  return count ?? 0;
}

export async function deleteOfferDocument(placementId: string, documentId: string) {
  const { data, error } = await createAdminClient()
    .from("placement_documents")
    .delete()
    .eq("placement_id", placementId)
    .eq("id", documentId)
    .select("path");
  if (error) throw error;
  if (data.length > 0)
    await createAdminClient().storage.from(BUCKET).remove(data.map((d) => d.path));
  return data.length > 0;
}
