/**
 * Apply only shipping-fee D1 migrations (remote or local).
 *
 * Usage:
 *   node scripts/d1-apply-shipping-only.mjs           # production D1
 *   node scripts/d1-apply-shipping-only.mjs --local   # wrangler local D1
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const local = process.argv.includes("--local");
const flag = local ? "--local" : "--remote";
const files = [
  "prisma/migrations/20260714190000_shipping_fee_rates/migration.sql",
  "prisma/migrations/20260714200000_shipping_methods/migration.sql",
];

function isAlreadyAppliedOutput(output) {
  return (
    output.includes("duplicate column name") ||
    output.includes("already exists") ||
    output.includes("duplicate column")
  );
}

for (const file of files) {
  if (!fs.existsSync(path.join(file))) {
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
  if (result.status === 0) continue;
  if (isAlreadyAppliedOutput(output)) {
    console.warn(`Skipping ${file}: already applied.`);
    continue;
  }
  if (output) console.error(output);
  process.exit(result.status ?? 1);
}

console.log("Shipping D1 migrations complete.");
