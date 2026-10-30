import { sendDueInterviewReminders } from "@/server/applications/reminders";
import { runCronJob } from "@/server/cron";

export const maxDuration = 60;

export function POST(request: Request) {
  return runCronJob(request, "interview-reminders", sendDueInterviewReminders);
}
