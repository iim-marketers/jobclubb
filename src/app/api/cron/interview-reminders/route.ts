import { sendDueInterviewReminders } from "@/server/applications/reminders";
import { runCronJob } from "@/server/cron";

export const maxDuration = 60;

// Called every 15 minutes by the Supabase cron job "interview-reminders".
export function POST(request: Request) {
  return runCronJob(request, "interview-reminders", sendDueInterviewReminders);
}
