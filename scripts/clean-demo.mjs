// Removes everything `npm run demo:seed` created. Deleting a demo login
// cascades to its company or candidate row, and from there to jobs,
// applications, interviews and placements.
import { existsSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

if (existsSync(".env")) process.loadEnvFile(".env");

const DEMO = /^delivered\+jcdemo-[a-z0-9-]+@resend\.dev$/;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const demoUsers = [];
for (let page = 1; ; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) {
    console.error("Listing users failed:", error.message);
    process.exit(1);
  }
  demoUsers.push(...data.users.filter((u) => DEMO.test(u.email ?? "")));
  if (data.users.length < 1000) break;
}

let failed = 0;
for (const user of demoUsers) {
  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) {
    failed++;
    console.error(`Deleting ${user.email} failed:`, error.message);
  }
}

console.log(`Deleted ${demoUsers.length - failed} demo accounts and everything attached to them.`);
if (failed) process.exit(1);
