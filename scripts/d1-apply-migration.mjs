/**
 * Apply Prisma SQLite migration SQL files to Cloudflare D1 (remote or local).
 * Skips the initial bootstrap migration by default (tables already exist on production).
 *
 * Usage:
 *   node scripts/d1-apply-migration.mjs           # --remote, pending migrations only
 *   node scripts/d1-apply-migration.mjs --local   # wrangler preview / miniflare
 *   node scripts/d1-apply-migration.mjs --full-init  # include init migration (fresh DB only)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const local = process.argv.includes("--local");
const fullInit = process.argv.includes("--full-init");
const flag = local ? "--local" : "--remote";
const migrationsRoot = path.join("prisma", "migrations");
const INIT_MIGRATION = "20260708120000_init_sqlite";

const migrationDirs = fs
  .readdirSync(migrationsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
  .filter((dir) => fullInit || dir !== INIT_MIGRATION);

function isAlreadyAppliedOutput(output) {
  return (
    output.includes("duplicate column name") ||
    output.includes("already exists") ||
    output.includes("duplicate column")
  );
}

for (const dir of migrationDirs) {
  const migrationFile = path.join(migrationsRoot, dir, "migration.sql");
  if (!fs.existsSync(migrationFile)) continue;
  console.log(`Applying ${migrationFile} to D1 (${flag})…`);

  const result = spawnSync(
    "npx",
    ["wrangler", "d1", "execute", "humpbuck-site", flag, `--file=${migrationFile}`],
    { encoding: "utf-8", shell: true },
  );

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  if (result.status === 0) continue;

  if (isAlreadyAppliedOutput(output)) {
    console.warn(`Skipping ${dir}: already applied on D1.`);
    continue;
  }

  if (output) console.error(output);
  process.exit(result.status ?? 1);
}

console.log("D1 migration pass complete.");
