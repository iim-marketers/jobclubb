"use server";

import { sendCandidatePasswordReset } from "@/server/auth/password-reset";

export async function requestPasswordReset(email: string): Promise<{ error?: string }> {
  return sendCandidatePasswordReset(email);
}
