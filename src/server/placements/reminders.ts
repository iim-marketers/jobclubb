import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import {
  sendOfferExpired,
  sendOfferUploadReminder,
  sendPaymentReminder,
} from "@/server/placements/emails";

type Reminder = {
  placement_id: string;
  kind: "offer_upload" | "payment_3d" | "payment_1d";
  for_date: string;
};

function sendReminder(reminder: Reminder) {
  if (reminder.kind === "offer_upload") return sendOfferUploadReminder(reminder.placement_id);
  return sendPaymentReminder(reminder.placement_id, reminder.kind === "payment_1d");
}

export async function runPlacementJobs() {
  const admin = createAdminClient();

  const { data: expired, error: expireError } = await admin.rpc("expire_placements");
  if (expireError) throw expireError;
  for (const id of expired as string[]) await sendOfferExpired(id);

  const { data, error } = await admin.rpc("claim_placement_reminders");
  if (error) throw error;
  const reminders = data as Reminder[];

  let failed = 0;
  for (const reminder of reminders) {
    try {
      await sendReminder(reminder);
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
  return { expired: (expired as string[]).length, reminders: reminders.length - failed, failed };
}
