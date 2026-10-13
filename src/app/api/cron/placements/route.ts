import { runCronJob } from "@/server/cron";
import { runPlacementJobs } from "@/server/placements/reminders";

export const maxDuration = 60;

// Called hourly by the Supabase cron job "placements".
export function POST(request: Request) {
  return runCronJob(request, "placements", runPlacementJobs);
}
