import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { sendOfferUploadReminder } from "@/server/placements/emails";

type Reminder = {
  placement_id: string;
  kind: "offer_upload";
  for_date: string;
};

export async function runPlacementJobs() {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_placement_reminders");
  if (error) throw error;
  const reminders = data as Reminder[];

  let failed = 0;
  for (const reminder of reminders) {
    try {
      await sendOfferUploadReminder(reminder.placement_id);
    } catch (sendError) {
      failed++;
      console.error("Sending placement reminder failed", reminder, sendError);
      const { error: releaseError } = await admin
        .from("placement_reminders")
        .delete()
        .eq("placement_id", reminder.placement_id)
        .eq("kind", reminder.kind)
        .eq("for_date", reminder.for_date);
      if (releaseError) console.error("Releasing placement reminder failed", reminder, releaseError);
    }
  }
  return { reminders: reminders.length - failed, failed };
}
