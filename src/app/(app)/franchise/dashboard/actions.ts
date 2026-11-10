"use server";

import { revalidatePath } from "next/cache";

import type { SettingsActionState } from "@/app/(app)/candidate/dashboard/settings/actions";
import {
  FRANCHISE_CANDIDATES,
  FRANCHISE_REGISTER,
  FRANCHISE_SETTINGS,
  validateBankDetails,
  validateFranchiseCandidate,
  validateOtp,
} from "@/lib/franchise";
import type { FieldErrors } from "@/lib/sign-up-validation";
import { changeOwnPassword } from "@/server/auth/change-password";
import { requireFranchise } from "@/server/franchises/current";
import { addOwnBankDetails } from "@/server/franchises/franchises";
import {
  resendCode,
  resendWelcome,
  startRegistration,
  verifyRegistration,
} from "@/server/franchises/registration";

const FAILED = "Something went wrong. Please try again.";

export type RegistrationState = {
  errors?: FieldErrors;
  error?: string;
  pending?: { registrationId: string; email: string; name: string };
};

export async function startCandidateRegistration(
  _prev: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const franchise = await requireFranchise(FRANCHISE_REGISTER);
  const { values, errors } = validateFranchiseCandidate(formData);
  if (Object.keys(errors).length > 0) return { errors };

  try {
    const result = await startRegistration(franchise, values);
    if (!result.ok) return { errors: result.errors, error: result.error };
    return {
      pending: {
        registrationId: result.registrationId,
        email: result.email,
        name: `${values.firstName} ${values.lastName}`,
      },
    };
  } catch (error) {
    console.error("Starting franchise registration failed", error);
    return { error: FAILED };
  }
}

export type VerifyState = {
  error?: string;
  restart?: boolean;
  registered?: { candidateId: string; name: string };
};

export async function verifyCandidateCode(
  registrationId: string,
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const franchise = await requireFranchise(FRANCHISE_REGISTER);
  const { code, error } = validateOtp(formData);
  if (error) return { error };

  try {
    const result = await verifyRegistration(franchise, registrationId, code);
    if (!result.ok) return { error: result.error, restart: result.restart };
    revalidatePath("/franchise/dashboard", "layout");
    revalidatePath("/admin", "layout");
    return { registered: { candidateId: result.candidateId, name: result.name } };
  } catch (error) {
    console.error("Verifying franchise registration failed", error);
    return { error: FAILED };
  }
}

export async function resendCandidateCode(
  registrationId: string,
): Promise<{ error?: string; restart?: boolean }> {
  const franchise = await requireFranchise(FRANCHISE_REGISTER);
  try {
    const result = await resendCode(franchise, registrationId);
    return result.ok ? {} : { error: result.error, restart: result.restart };
  } catch (error) {
    console.error("Resending franchise registration code failed", error);
    return { error: FAILED };
  }
}

export async function resendWelcomeEmail(candidateId: string): Promise<{ error?: string }> {
  const franchise = await requireFranchise(FRANCHISE_CANDIDATES);
  try {
    const result = await resendWelcome(franchise, candidateId);
    if (result === "rate_limited") return { error: "An email was sent moments ago. Wait a minute before sending another." };
    if (!result) return { error: "This candidate isn't on your list. Refresh to see the latest." };
    return {};
  } catch (error) {
    console.error("Resending franchise welcome email failed", error);
    return { error: FAILED };
  }
}

export async function changeFranchisePassword(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  await requireFranchise(FRANCHISE_SETTINGS);
  return changeOwnPassword(formData);
}

export async function addBankDetails(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const franchise = await requireFranchise(FRANCHISE_SETTINGS);
  if (franchise.bankAccountNo)
    return { error: "Your bank details are already saved. To change them, email support@jobclubb.com." };
  const { values, errors } = validateBankDetails(formData);
  if (Object.keys(errors).length > 0) return { errors };

  try {
    if (!(await addOwnBankDetails(franchise.id, values)))
      return { error: "Your bank details are already saved. Refresh the page to see them." };
  } catch (error) {
    console.error("Saving franchise bank details failed", error);
    return { error: FAILED };
  }
  revalidatePath("/franchise/dashboard", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
