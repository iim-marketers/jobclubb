import { sendDueMembershipReminders } from "@/server/candidates/membership-reminders";
import { runCronJob } from "@/server/cron";

export const maxDuration = 60;

// Called hourly by the Supabase cron job "membership-reminders".
export function POST(request: Request) {
  return runCronJob(request, "membership-reminders", sendDueMembershipReminders);
}
