import "server-only";

import { validateNewPassword, type FieldErrors } from "@/lib/sign-up-validation";
import { createClient } from "@/lib/supabase/server";

export async function changeOwnPassword(
  formData: FormData,
): Promise<{ ok?: boolean; error?: string; errors?: FieldErrors }> {
  const errors = validateNewPassword(formData);
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: String(formData.get("password")),
  });

  if (error) {
    if (error.code === "same_password")
      return { errors: { password: "Choose a password you haven't used here before." } };
    if (error.code === "weak_password")
      return { errors: { password: "That password is too weak. Try a longer one." } };
    if (error.code === "reauthentication_needed")
      return { error: "For security, sign out and back in, then change your password." };
    console.error("Changing password failed", error);
    return { error: "We couldn't change your password. Please try again." };
  }

  return { ok: true };
}
