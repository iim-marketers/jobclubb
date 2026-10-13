import "server-only";

import { timingSafeEqual } from "node:crypto";

// Cron routes are called by Supabase pg_cron (see public.request_cron) with
// the Vault secret cron_secret, which must match CRON_SECRET.
export function isCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function runCronJob(request: Request, name: string, job: () => Promise<object>) {
  if (!isCronRequest(request)) return Response.json({ error: "Unauthorized." }, { status: 401 });
  try {
    return Response.json(await job());
  } catch (error) {
    console.error(`Cron job ${name} failed`, error);
    return Response.json({ error: "Cron job failed." }, { status: 500 });
  }
}
