"use server";

import { sendPasswordReset, type ResetRole } from "@/server/auth/password-reset";

export type { ResetRole };

export async function requestPasswordReset(email: string): Promise<{ error?: string }> {
  return sendPasswordReset(email);
}
