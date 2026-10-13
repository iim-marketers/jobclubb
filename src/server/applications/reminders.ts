import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { sendInterviewReminder } from "@/server/applications/emails";

export async function sendDueInterviewReminders() {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_interview_reminders");
  if (error) throw error;
  const ids = data as string[];

  let failed = 0;
  for (const id of ids) {
    try {
      await sendInterviewReminder(id);
    } catch (sendError) {
      failed++;
      console.error("Sending interview reminder failed", id, sendError);
      const { error: releaseError } = await admin
        .from("job_interviews")
        .update({ reminder_sent_at: null })
        .eq("id", id)
        .is("cancelled_at", null)
        .is("outcome", null);
      if (releaseError) console.error("Releasing interview reminder failed", id, releaseError);
    }
  }
  return { sent: ids.length - failed, failed };
}
