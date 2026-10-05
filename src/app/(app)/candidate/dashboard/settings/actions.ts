"use server";

import { revalidatePath } from "next/cache";

import { CANDIDATE_HOME } from "@/components/candidate/nav";
import {
  validateCandidateProfile,
  type FieldErrors,
} from "@/lib/sign-up-validation";
import { createClient } from "@/lib/supabase/server";
import { changeOwnPassword } from "@/server/auth/change-password";
import { requireCandidate } from "@/server/auth/current-candidate";
import {
  deleteCandidatePhoto,
  isAcceptedPhoto,
  uploadCandidatePhoto,
} from "@/server/candidates/photo";

const SETTINGS_PATH = `${CANDIDATE_HOME}/settings`;

export type SettingsActionState = {
  ok?: boolean;
  error?: string;
  errors?: FieldErrors;
};

export async function updateProfile(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const candidate = await requireCandidate(SETTINGS_PATH);
  const { values, errors } = validateCandidateProfile(formData);
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("candidates")
    .update({
      first_name: values.firstName,
      last_name: values.lastName,
      phone: values.phone,
      city: values.city,
      pincode: values.pincode,
      vertical: values.vertical,
    })
    .eq("id", candidate.id);

  if (error) {
    console.error("Updating candidate profile failed", error);
    return { error: "We couldn't save your changes. Please try again." };
  }

  revalidatePath("/candidate", "layout");
  return { ok: true };
}

export async function changePassword(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  await requireCandidate(SETTINGS_PATH);
  return changeOwnPassword(formData);
}

async function savePhotoPath(candidateId: string, photoPath: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("candidates")
    .update({ photo_path: photoPath })
    .eq("id", candidateId);
  if (error) throw error;
}

export async function updatePhoto(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const candidate = await requireCandidate(SETTINGS_PATH);
  const file = formData.get("photo");
  if (!isAcceptedPhoto(file))
    return { error: "Choose a JPG, PNG or WebP image." };

  let path: string | undefined;
  try {
    path = await uploadCandidatePhoto(candidate.id, file);
    await savePhotoPath(candidate.id, path);
  } catch (error) {
    console.error("Updating candidate photo failed", error);
    if (path) await deleteCandidatePhoto(path);
    return { error: "We couldn't upload your photo. Please try again." };
  }

  if (candidate.photo_path) await deleteCandidatePhoto(candidate.photo_path);
  revalidatePath("/candidate", "layout");
  return { ok: true };
}

export async function removePhoto(): Promise<SettingsActionState> {
  const candidate = await requireCandidate(SETTINGS_PATH);
  if (!candidate.photo_path) return { ok: true };

  try {
    await savePhotoPath(candidate.id, null);
  } catch (error) {
    console.error("Removing candidate photo failed", error);
    return { error: "We couldn't remove your photo. Please try again." };
  }

  await deleteCandidatePhoto(candidate.photo_path);
  revalidatePath("/candidate", "layout");
  return { ok: true };
}
