/**
 * Apply Prisma SQLite migration SQL to Cloudflare D1 (remote or local Wrangler preview DB).
 *
 * Usage:
 *   node scripts/d1-apply-migration.mjs           # --remote
 *   node scripts/d1-apply-migration.mjs --local   # wrangler preview / miniflare
 */
import { execSync } from "node:child_process";
import path from "node:path";

const local = process.argv.includes("--local");
const flag = local ? "--local" : "--remote";
const migrationFile = path.join(
  "prisma",
  "migrations",
  "20260708120000_init_sqlite",
  "migration.sql",
);

console.log(`Applying ${migrationFile} to D1 (${flag})…`);
execSync(
  `npx wrangler d1 execute humpbuck-site ${flag} --file="${migrationFile}"`,
  { stdio: "inherit" },
);
