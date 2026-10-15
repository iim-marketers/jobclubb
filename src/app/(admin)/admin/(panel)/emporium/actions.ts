"use server";

import { revalidatePath } from "next/cache";

import {
  validateEmporiumBatch,
  validateSeats,
  type EmporiumBatch,
} from "@/lib/emporium";
import type { FieldErrors } from "@/lib/sign-up-validation";
import { requireAdmin } from "@/server/admin/session";
import {
  createEmporiumBatch,
  deleteEmporiumBatch,
  setEmporiumBatchActive,
  setEmporiumBatchSeats,
} from "@/server/emporium/batches";

const FAILED = "Something went wrong. Please try again.";
const MISSING = "This batch no longer exists. Refresh to see the latest.";

export type CreateBatchState = {
  errors?: FieldErrors;
  error?: string;
  created?: { batch: EmporiumBatch; location: string; locationId: string };
};

function refresh(locationId?: string) {
  revalidatePath("/admin/emporium");
  if (locationId) revalidatePath(`/admin/emporium/${locationId}`);
}

export async function createBatch(
  _prev: CreateBatchState,
  formData: FormData,
): Promise<CreateBatchState> {
  await requireAdmin();
  const { values, errors } = validateEmporiumBatch(formData);
  if (Object.keys(errors).length > 0) return { errors };

  try {
    const result = await createEmporiumBatch(values);
    if (!result.ok) return { errors: result.errors };
    refresh(result.locationId);
    return {
      created: { batch: result.batch, location: result.location, locationId: result.locationId },
    };
  } catch (error) {
    console.error("Creating Emporium batch failed", error);
    return { error: FAILED };
  }
}

export async function updateBatchSeats(
  id: string,
  used: number,
  _prev: { errors?: FieldErrors; error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ errors?: FieldErrors; error?: string; ok?: boolean }> {
  await requireAdmin();
  const value = String(formData.get("seats") ?? "").trim();
  const seatsError = validateSeats(value, used);
  if (seatsError) return { errors: { seats: seatsError } };

  try {
    const locationId = await setEmporiumBatchSeats(id, Number(value));
    if (!locationId)
      return { error: "More students have signed up since you opened this. Refresh and try again." };
    refresh(locationId);
    return { ok: true };
  } catch (error) {
    console.error("Updating Emporium batch seats failed", error);
    return { error: FAILED };
  }
}

export async function setBatchActive(id: string, active: boolean): Promise<{ error?: string }> {
  await requireAdmin();
  try {
    const locationId = await setEmporiumBatchActive(id, active);
    if (!locationId) return { error: MISSING };
    refresh(locationId);
    return {};
  } catch (error) {
    console.error("Updating Emporium batch status failed", error);
    return { error: FAILED };
  }
}

export async function deleteBatch(
  id: string,
): Promise<{ error?: string; locationRemoved?: boolean }> {
  await requireAdmin();
  try {
    const result = await deleteEmporiumBatch(id);
    if (result.error === "in-use")
      return { error: "Students have already joined with this code. Pause it instead." };
    if (result.error === "missing") return { error: MISSING };
    refresh(result.locationId);
    return { locationRemoved: result.locationRemoved };
  } catch (error) {
    console.error("Deleting Emporium batch failed", error);
    return { error: FAILED };
  }
}
