import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set. See supabase/README.md → Migrations.");
  process.exit(1);
}

const { status } = spawnSync(
  "supabase",
  [...process.argv.slice(2), "--db-url", dbUrl],
  { stdio: "inherit" },
);
process.exit(status ?? 1);
