import { GSTIN_PATTERN, type FieldErrors } from "@/lib/sign-up-validation";

export const SUPPORT_EMAIL = "support@jobclubb.com";

export const CHANGE_FIELDS = [
  { value: "company_name", label: "Company name", maxLength: 120 },
  { value: "city", label: "Property city", maxLength: 80 },
  { value: "gstin", label: "GSTIN", maxLength: 15 },
] as const;

export type ChangeField = (typeof CHANGE_FIELDS)[number]["value"];

export const MAX_REASON_LENGTH = 500;

export const changeFieldLabel = (field: string) =>
  CHANGE_FIELDS.find((f) => f.value === field)?.label ?? field;

export function validateChangeRequest(
  formData: FormData,
  current: Record<ChangeField, string | null>,
) {
  const field = String(formData.get("field") ?? "");
  const definition = CHANGE_FIELDS.find((f) => f.value === field);
  let newValue = String(formData.get("newValue") ?? "").trim().replace(/\s+/g, " ");
  const reason = String(formData.get("reason") ?? "").trim();
  const errors: FieldErrors = {};

  if (!definition) {
    errors.field = "Choose what you'd like to change.";
  } else {
    if (field === "gstin") newValue = newValue.toUpperCase().replace(/\s/g, "");
    if (!newValue) errors.newValue = `Enter the new ${definition.label.toLowerCase()}.`;
    else if (newValue.length > definition.maxLength)
      errors.newValue = `Use ${definition.maxLength} characters or fewer.`;
    else if (field === "gstin" && !GSTIN_PATTERN.test(newValue))
      errors.newValue = "GSTIN should be 15 characters, like 19AABCT1234F1Z5.";
    else if (newValue === current[definition.value])
      errors.newValue = "That's the same as the current value.";
  }

  if (!reason) errors.reason = "Tell us why this needs to change.";
  else if (reason.length > MAX_REASON_LENGTH)
    errors.reason = `Use ${MAX_REASON_LENGTH} characters or fewer.`;

  return { values: { field: field as ChangeField, newValue, reason }, errors };
}
