/**
 * Runs `prisma migrate deploy` with DATABASE_URL from .env / .env.local (same as Next.js).
 * Prisma CLI only auto-loads `.env`, not `.env.local`.
 */
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadProjectEnv } = require("./load-project-env.mjs") as typeof import("./load-project-env.mjs");

loadProjectEnv();

const migrateUrl = process.env.DATABASE_URL?.trim() || "file:./dev.db";
if (!migrateUrl) {
  console.error("DATABASE_URL is missing. Add file:./dev.db to .env.local for local SQLite.");
  process.exit(1);
}

process.env.DATABASE_URL = migrateUrl;

execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: process.env,
});
