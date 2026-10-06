"use server";

import { revalidatePath } from "next/cache";

import type { SettingsActionState } from "@/app/(app)/candidate/dashboard/settings/actions";
import { COMPANY_HOME } from "@/components/company/nav";
import {
  validateCompanyContact,
  validateCompanyDetails,
  type FieldErrors,
} from "@/lib/sign-up-validation";
import { createAdminClient } from "@/lib/supabase/server";
import { changeOwnPassword } from "@/server/auth/change-password";
import { requireCompany } from "@/server/auth/current-company";
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
  const { values, errors } = validateCompanyDetails(formData);
  return saveCompany(
    {
      property_name: values.propertyName || null,
      industry: values.industry,
      city: values.city,
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
