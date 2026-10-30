import { sendDueMembershipReminders } from "@/server/candidates/membership-reminders";
import { runCronJob } from "@/server/cron";

export const maxDuration = 60;

export function POST(request: Request) {
  return runCronJob(request, "membership-reminders", sendDueMembershipReminders);
}
