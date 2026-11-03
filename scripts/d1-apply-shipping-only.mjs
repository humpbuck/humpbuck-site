/**
 * Apply shipping catch-up SQL (tables + OH columns) to D1.
 *
 *   node scripts/d1-apply-shipping-only.mjs           # --remote
 *   node scripts/d1-apply-shipping-only.mjs --local
 *
 * Prefer `npm run db:d1:remote` / `db:d1:local` for Prisma migration folders.
 * This script is the one-shot catch-up for production D1 that predates OH columns.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const local = process.argv.includes("--local");
const flag = local ? "--local" : "--remote";
const file = path.join("scripts", "d1-shipping-catchup.sql");

if (!fs.existsSync(file)) {
  console.error(`Missing ${file}`);
  process.exit(1);
}

console.log(`Applying ${file} to D1 (${flag})…`);
const result = spawnSync(
  "npx",
  ["wrangler", "d1", "execute", "humpbuck-site", flag, `--file=${file}`],
  { encoding: "utf-8", shell: true },
);
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
if (output) console.log(output);

if (result.status === 0) {
  console.log("Shipping catch-up applied.");
  process.exit(0);
}

if (
  output.includes("duplicate column name") ||
  output.includes("already exists") ||
  output.includes("duplicate column")
) {
  console.warn("Some statements already applied — treat as OK for catch-up.");
  process.exit(0);
}

process.exit(result.status ?? 1);
