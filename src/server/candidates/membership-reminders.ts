import "server-only";

import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { sendEmail } from "@/lib/email/mailer";
import { membershipExpiringEmail } from "@/lib/email/templates/membership-expiring";
import { PLAN_DETAILS, isMembershipPlan } from "@/lib/membership";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/server";

type Reminder = { candidate_id: string; expires_at: string; days_before: 15 | 1 };

async function sendReminder(reminder: Reminder) {
  const { data: candidate, error } = await createAdminClient()
    .from("candidates")
    .select("first_name, email, membership_plan")
    .eq("id", reminder.candidate_id)
    .single();
  if (error) throw error;
  if (!isMembershipPlan(candidate.membership_plan)) return;

  await sendEmail({
    to: candidate.email,
    ...membershipExpiringEmail({
      firstName: candidate.first_name,
      email: candidate.email,
      planName: PLAN_DETAILS[candidate.membership_plan].name,
      expiresAt: reminder.expires_at,
      final: reminder.days_before === 1,
      membershipUrl: `${SITE_URL}${CANDIDATE_HOME}/membership`,
    }),
  });
}

export async function sendDueMembershipReminders() {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_membership_reminders");
  if (error) throw error;
  const reminders = data as Reminder[];

  let failed = 0;
  for (const reminder of reminders) {
    try {
      await sendReminder(reminder);
    } catch (sendError) {
      failed++;
      console.error("Sending membership reminder failed", reminder, sendError);
      const { error: releaseError } = await admin
        .from("membership_reminders")
        .delete()
        .eq("candidate_id", reminder.candidate_id)
        .eq("expires_at", reminder.expires_at)
        .eq("days_before", reminder.days_before);
      if (releaseError) console.error("Releasing membership reminder failed", reminder, releaseError);
    }
  }
  return { sent: reminders.length - failed, failed };
}
