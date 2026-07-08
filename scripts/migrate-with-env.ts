/**
 * Runs `prisma migrate deploy` with DATABASE_URL from .env / .env.local (same as Next.js).
 * Prisma CLI only auto-loads `.env`, not `.env.local`.
 */
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadProjectEnv } = require("./load-project-env.mjs") as typeof import("./load-project-env.mjs");

loadProjectEnv();

const migrateUrl =
  process.env.DIRECT_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!migrateUrl) {
  console.error(
    "DATABASE_URL or DIRECT_DATABASE_URL is missing. Add Neon postgresql://... to .env.local.",
  );
  process.exit(1);
}

process.env.DATABASE_URL = migrateUrl;

execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: process.env,
});
