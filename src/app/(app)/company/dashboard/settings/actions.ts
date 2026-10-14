"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import type { SettingsActionState } from "@/app/(app)/candidate/dashboard/settings/actions";
import { COMPANY_HOME } from "@/components/company/nav";
import { validateChangeRequest } from "@/lib/company-change-requests";
import {
  validateCompanyContact,
  validateCompanyDetails,
  type FieldErrors,
} from "@/lib/sign-up-validation";
import { createAdminClient } from "@/lib/supabase/server";
import { changeOwnPassword } from "@/server/auth/change-password";
import { requireCompany } from "@/server/auth/current-company";
import { deleteOwnAccount } from "@/server/auth/delete-account";
import { sendChangeRequested } from "@/server/companies/change-request-emails";
import { cancelChangeRequest, createChangeRequest } from "@/server/companies/change-requests";
import {
  deleteCompanyLogo,
  isAcceptedLogo,
  uploadCompanyLogo,
} from "@/server/companies/logo";

const SETTINGS_PATH = `${COMPANY_HOME}/settings`;

// Companies can only read their own row, so writes go through the admin client.
async function saveCompany(
  values: Record<string, string | null>,
  errors: FieldErrors,
): Promise<SettingsActionState> {
  const company = await requireCompany(SETTINGS_PATH);
  if (Object.keys(errors).length > 0) return { errors };

  const { error } = await createAdminClient()
    .from("companies")
    .update(values)
    .eq("id", company.id);

  if (error) {
    console.error("Updating company profile failed", error);
    return { error: "We couldn't save your changes. Please try again." };
  }

  revalidatePath("/company", "layout");
  return { ok: true };
}

export async function updateCompanyDetails(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const company = await requireCompany(SETTINGS_PATH);
  const { values, errors } = validateCompanyDetails(formData, company.pincode);
  return saveCompany(
    {
      property_name: values.propertyName || null,
      industry: values.industry,
      size: values.size,
      website: values.website || null,
      pincode: values.pincode,
    },
    errors,
  );
}

export async function updateCompanyContact(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { values, errors } = validateCompanyContact(formData);
  return saveCompany(
    {
      contact_name: values.contactName,
      designation: values.designation,
      phone: values.phone,
    },
    errors,
  );
}

export async function requestCompanyChange(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const company = await requireCompany(SETTINGS_PATH);
  const { values, errors } = validateChangeRequest(formData, {
    company_name: company.company_name,
    city: company.city,
    gstin: company.gstin,
  });
  if (Object.keys(errors).length > 0) return { errors };

  let id: string | null;
  try {
    id = await createChangeRequest({
      companyId: company.id,
      companyName: company.company_name,
      field: values.field,
      oldValue: company[values.field],
      newValue: values.newValue,
      reason: values.reason,
    });
  } catch (error) {
    console.error("Creating company change request failed", error);
    return { error: "We couldn't send your request. Please try again." };
  }
  if (!id) return { errors: { field: "You already have a request for this under review." } };

  after(() => sendChangeRequested(id));
  revalidatePath(SETTINGS_PATH);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function cancelCompanyChange(id: string): Promise<{ error?: string }> {
  const company = await requireCompany(SETTINGS_PATH);
  try {
    await cancelChangeRequest(company.id, id);
  } catch (error) {
    console.error("Cancelling company change request failed", error);
    return { error: "We couldn't cancel the request. Please try again." };
  }
  revalidatePath(SETTINGS_PATH);
  revalidatePath("/admin", "layout");
  return {};
}

export async function deleteCompanyAccount(): Promise<{ error?: string }> {
  const company = await requireCompany(SETTINGS_PATH);
  return deleteOwnAccount(company);
}

export async function changeCompanyPassword(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  await requireCompany(SETTINGS_PATH);
  return changeOwnPassword(formData);
}

async function saveLogoPath(companyId: string, logoPath: string | null) {
  const { error } = await createAdminClient()
    .from("companies")
    .update({ logo_path: logoPath })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyLogo(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const company = await requireCompany(SETTINGS_PATH);
  const file = formData.get("logo");
  if (!isAcceptedLogo(file)) return { error: "Choose a JPG, PNG or WebP image." };

  let path: string | undefined;
  try {
    path = await uploadCompanyLogo(company.id, file);
    await saveLogoPath(company.id, path);
  } catch (error) {
    console.error("Updating company logo failed", error);
    if (path) await deleteCompanyLogo(path);
    return { error: "We couldn't upload your logo. Please try again." };
  }

  if (company.logo_path) await deleteCompanyLogo(company.logo_path);
  revalidatePath("/company", "layout");
  return { ok: true };
}

export async function removeCompanyLogo(): Promise<SettingsActionState> {
  const company = await requireCompany(SETTINGS_PATH);
  if (!company.logo_path) return { ok: true };

  try {
    await saveLogoPath(company.id, null);
  } catch (error) {
    console.error("Removing company logo failed", error);
    return { error: "We couldn't remove your logo. Please try again." };
  }

  await deleteCompanyLogo(company.logo_path);
  revalidatePath("/company", "layout");
  return { ok: true };
}
