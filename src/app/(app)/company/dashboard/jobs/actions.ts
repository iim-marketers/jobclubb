"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { COMPANY_JOBS } from "@/components/company/nav";
import { validateJob, validateJobLocation } from "@/lib/company-jobs";
import { EMPLOYER_TERMS_VERSION } from "@/lib/terms-content";
import type { FieldErrors } from "@/lib/sign-up-validation";
import { requireCompany, type CurrentCompany } from "@/server/auth/current-company";
import {
  createCompanyJob,
  setCompanyJobOpen,
  updateCompanyJob,
} from "@/server/companies/jobs";

export type JobFormState = { errors?: FieldErrors; error?: string };

function validate(company: CurrentCompany, formData: FormData) {
  const job = validateJob(formData);
  if (!company.is_partner) return { ...job, location: null };
  const location = validateJobLocation(formData);
  return {
    values: job.values,
    location: location.values,
    errors: { ...job.errors, ...location.errors },
  };
}

export async function createJob(
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const company = await requireCompany(`${COMPANY_JOBS}/new`);
  if (company.terms_version !== EMPLOYER_TERMS_VERSION)
    return { error: "Accept the updated terms at the top of the page before posting a job." };
  const { values, location, errors } = validate(company, formData);
  if (Object.keys(errors).length > 0) return { errors };

  let id: string;
  try {
    id = await createCompanyJob(company.id, values, location);
  } catch (error) {
    console.error("Creating job posting failed", error);
    return { error: "We couldn't post this job. Please try again." };
  }

  revalidatePath("/company", "layout");
  redirect(`${COMPANY_JOBS}/${id}?submitted=1`);
}

export async function updateJob(
  id: string,
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const company = await requireCompany(`${COMPANY_JOBS}/${id}/edit`);
  const { values, location, errors } = validate(company, formData);
  if (Object.keys(errors).length > 0) return { errors };

  let updated: boolean;
  try {
    updated = await updateCompanyJob(company.id, id, values, location);
  } catch (error) {
    console.error("Updating job posting failed", error);
    return { error: "We couldn't save this job. Please try again." };
  }
  if (!updated) return { error: "Closed postings can't be edited. Reopen it first." };

  revalidatePath("/company", "layout");
  redirect(`${COMPANY_JOBS}/${id}?submitted=1`);
}

export async function setJobOpen(
  id: string,
  open: boolean,
): Promise<{ error?: string }> {
  const company = await requireCompany(`${COMPANY_JOBS}/${id}`);
  try {
    const changed = await setCompanyJobOpen(company.id, id, open);
    if (!changed) return { error: "This posting has already changed. Refresh to see it." };
  } catch (error) {
    console.error("Changing job posting status failed", error);
    return { error: "We couldn't update this posting. Please try again." };
  }

  revalidatePath("/company", "layout");
  return {};
}
