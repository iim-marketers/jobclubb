import "server-only";

import { randomInt } from "node:crypto";

import {
  locationPrefix,
  type EmporiumBatch,
  type EmporiumCodeCheck,
  type EmporiumLocationSummary,
  type EmporiumStudent,
} from "@/lib/emporium";
import { EMPORIUM_CODE_PREFIX, type FieldErrors } from "@/lib/sign-up-validation";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/server";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_RANDOM_LENGTH = 6;
const BATCH_COLUMNS = "id, location_id, batch_no, code, seats, active, created_at";

type BatchRow = {
  id: string;
  location_id: string;
  batch_no: number;
  code: string;
  seats: number;
  active: boolean;
  created_at: string;
};

export const signUpUrlFor = (code: string) =>
  `${SITE_URL}/sign-up?code=${encodeURIComponent(code)}`;

// e.g. JC-EM-SHI-B1-7KQ2MX: readable enough to type, random enough not to guess.
function generateCode(location: string, batchNo: number) {
  const prefix = locationPrefix(location);
  let random = "";
  for (let i = 0; i < CODE_RANDOM_LENGTH; i++)
    random += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `${EMPORIUM_CODE_PREFIX}${prefix}-B${batchNo}-${random}`;
}

function toBatch(row: BatchRow, used: number): EmporiumBatch {
  return {
    id: row.id,
    batchNo: row.batch_no,
    code: row.code,
    signUpUrl: signUpUrlFor(row.code),
    seats: row.seats,
    used,
    active: row.active,
    createdAt: row.created_at,
  };
}

async function seatsUsed(batchIds: string[]) {
  const used = new Map<string, number>();
  if (batchIds.length === 0) return used;
  const { data, error } = await createAdminClient()
    .from("candidates")
    .select("emporium_batch_id")
    .in("emporium_batch_id", batchIds);
  if (error) throw error;
  for (const row of data) used.set(row.emporium_batch_id, (used.get(row.emporium_batch_id) ?? 0) + 1);
  return used;
}

export async function checkEmporiumCode(code: string): Promise<EmporiumCodeCheck> {
  const { data: batch, error } = await createAdminClient()
    .from("emporium_batches")
    .select("id, batch_no, seats, active, emporium_locations (name)")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  if (!batch) return { status: "invalid" };

  const label = {
    location: (batch.emporium_locations as unknown as { name: string }).name,
    batchNo: batch.batch_no as number,
  };
  if (!batch.active) return { status: "paused", ...label };
  const used = (await seatsUsed([batch.id])).get(batch.id) ?? 0;
  return { status: used >= batch.seats ? "full" : "ok", ...label };
}

export async function getCandidateEmporiumBatch(candidateId: string) {
  const { data, error } = await createAdminClient()
    .from("candidates")
    .select("emporium_batches (batch_no, emporium_locations (name))")
    .eq("id", candidateId)
    .maybeSingle();
  if (error) console.error("Loading candidate's Emporium batch failed", error);
  const batch = data?.emporium_batches as unknown as {
    batch_no: number;
    emporium_locations: { name: string };
  } | null;
  return batch ? { location: batch.emporium_locations.name, batchNo: batch.batch_no } : null;
}

export async function listEmporiumLocations(): Promise<EmporiumLocationSummary[]> {
  const admin = createAdminClient();
  const [locations, batches] = await Promise.all([
    admin.from("emporium_locations").select("id, name").order("name"),
    admin.from("emporium_batches").select(BATCH_COLUMNS),
  ]);
  if (locations.error) throw locations.error;
  if (batches.error) throw batches.error;

  const rows = batches.data as BatchRow[];
  const used = await seatsUsed(rows.map((b) => b.id));

  return locations.data.map((location) => {
    const own = rows.filter((b) => b.location_id === location.id);
    return {
      id: location.id,
      name: location.name,
      batches: own.length,
      activeBatches: own.filter((b) => b.active).length,
      nextBatchNo: Math.max(0, ...own.map((b) => b.batch_no)) + 1,
      seats: own.reduce((sum, b) => sum + b.seats, 0),
      used: own.reduce((sum, b) => sum + (used.get(b.id) ?? 0), 0),
      latestBatchAt: own.reduce<string | null>(
        (latest, b) => (!latest || b.created_at > latest ? b.created_at : latest),
        null,
      ),
    };
  });
}

export async function getEmporiumLocation(id: string) {
  const admin = createAdminClient();
  const [location, batches] = await Promise.all([
    admin.from("emporium_locations").select("id, name").eq("id", id).maybeSingle(),
    admin
      .from("emporium_batches")
      .select(BATCH_COLUMNS)
      .eq("location_id", id)
      .order("batch_no", { ascending: false }),
  ]);
  if (location.error) throw location.error;
  if (batches.error) throw batches.error;
  if (!location.data) return null;

  const rows = batches.data as BatchRow[];
  const { data: students, error } = rows.length
    ? await admin
        .from("candidates")
        .select(
          "id, first_name, last_name, email, phone, email_verified_at, membership_expires_at, created_at, emporium_batch_id",
        )
        .in(
          "emporium_batch_id",
          rows.map((b) => b.id),
        )
        .order("created_at", { ascending: false })
    : { data: [], error: null };
  if (error) throw error;

  return {
    id: location.data.id as string,
    name: location.data.name as string,
    batches: rows.map((row) => {
      const own = students.filter((s) => s.emporium_batch_id === row.id);
      return {
        ...toBatch(row, own.length),
        students: own.map(
          (s): EmporiumStudent => ({
            id: s.id,
            name: `${s.first_name} ${s.last_name}`,
            email: s.email,
            phone: s.phone,
            emailVerified: s.email_verified_at !== null,
            membershipExpiresAt: s.membership_expires_at,
            joinedAt: s.created_at,
          }),
        ),
      };
    }),
  };
}

export type CreateBatchResult =
  | { ok: true; batch: EmporiumBatch; locationId: string; location: string }
  | { ok: false; errors: FieldErrors };

export async function createEmporiumBatch(values: {
  location: string;
  batchNo: number;
  seats: number;
}): Promise<CreateBatchResult> {
  const admin = createAdminClient();

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await admin
      .rpc("create_emporium_batch", {
        p_location: values.location,
        p_batch_no: values.batchNo,
        p_seats: values.seats,
        p_code: generateCode(values.location, values.batchNo),
      })
      .select(BATCH_COLUMNS)
      .single();

    if (!error) {
      const row = data as BatchRow;
      const { data: location, error: locationError } = await admin
        .from("emporium_locations")
        .select("name")
        .eq("id", row.location_id)
        .single();
      if (locationError) throw locationError;
      return { ok: true, batch: toBatch(row, 0), locationId: row.location_id, location: location.name };
    }

    if (error.code !== "23505") throw error;
    if (error.message.includes("batch_no"))
      return {
        ok: false,
        errors: { batchNo: `Batch ${values.batchNo} already exists for ${values.location}.` },
      };
    // Otherwise the random code collided with an existing one: try another.
  }
  throw new Error("Couldn't generate a unique Emporium code.");
}

export async function setEmporiumBatchSeats(id: string, seats: number) {
  const { data, error } = await createAdminClient()
    .rpc("set_emporium_batch_seats", { p_id: id, p_seats: seats })
    .select("location_id")
    .maybeSingle();
  if (error) throw error;
  return data?.location_id as string | undefined;
}

export async function setEmporiumBatchActive(id: string, active: boolean) {
  const { data, error } = await createAdminClient()
    .from("emporium_batches")
    .update({ active })
    .eq("id", id)
    .select("location_id")
    .maybeSingle();
  if (error) throw error;
  return data?.location_id as string | undefined;
}

// A batch that students have joined can't be deleted (the foreign key
// refuses), only paused. Deleting a location's last batch removes the location.
export async function deleteEmporiumBatch(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("emporium_batches")
    .delete()
    .eq("id", id)
    .select("location_id")
    .maybeSingle();
  if (error?.code === "23503") return { error: "in-use" as const };
  if (error) throw error;
  if (!data) return { error: "missing" as const };

  const { count, error: countError } = await admin
    .from("emporium_batches")
    .select("id", { count: "exact", head: true })
    .eq("location_id", data.location_id);
  if (countError) throw countError;
  if (count === 0) {
    const { error: locationError } = await admin
      .from("emporium_locations")
      .delete()
      .eq("id", data.location_id);
    if (locationError) throw locationError;
    return { locationId: data.location_id as string, locationRemoved: true };
  }
  return { locationId: data.location_id as string, locationRemoved: false };
}
