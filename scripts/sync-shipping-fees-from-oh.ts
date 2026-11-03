/**
 * Upsert humpbuck ShippingFeeRate rows from Cainiao OH tiers.
 * ¥/kg = freightRmbPerKg, 派送费 = registrationFeeRmb at WATCH_WEIGHT_KG; 税费% = 4.
 * Checkout uses these admin rows only (¥/kg × weight + 派送费). For JP/KZ OH
 * calculator countries, review/edit ¥/kg and 派送费 after sync so multi-qty scales.
 *
 *   npx tsx scripts/sync-shipping-fees-from-oh.ts
 *   npx tsx scripts/sync-shipping-fees-from-oh.ts --target=sqlite
 *   npx tsx scripts/sync-shipping-fees-from-oh.ts --target=d1-local
 *   npx tsx scripts/sync-shipping-fees-from-oh.ts --target=d1-remote
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getShippingOhQuote } from "../lib/shipping-oh";
import { SHIPPING_DEFAULTS, WATCH_WEIGHT_KG } from "../lib/shipping-fee";
import {
  AU_SHIPPING_RATE_KEY_ZONE_12,
  AU_SHIPPING_RATE_KEY_ZONE_34,
  countryNameForShippingRateKey,
  listShippingFeeCountryOptions,
} from "../lib/shipping-fee-country-options";

type Target = "sqlite" | "d1-local" | "d1-remote";

function parseTarget(): Target {
  const arg = process.argv.find((item) => item.startsWith("--target="));
  const value = (arg?.slice("--target=".length) || "sqlite").trim().toLowerCase();
  if (value === "sqlite" || value === "d1-local" || value === "d1-remote") return value;
  throw new Error(`Unknown --target=${value}. Use sqlite | d1-local | d1-remote`);
}

const dbPath = path.resolve(process.cwd(), "prisma/dev.db");

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function cuidLike(): string {
  return `oh${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

type Row = {
  countryCode: string;
  countryName: string;
  pricePerKg: number;
  deliveryFee: number;
};

function collectRows(): { rows: Row[]; skipped: number } {
  const rows: Row[] = [];
  let skipped = 0;

  for (const opt of listShippingFeeCountryOptions()) {
    const code = opt.value;
    if (code === AU_SHIPPING_RATE_KEY_ZONE_12 || code === AU_SHIPPING_RATE_KEY_ZONE_34) continue;
    const q = getShippingOhQuote({
      countryCode: code,
      weightKg: WATCH_WEIGHT_KG,
      quantity: 1,
    });
    if (!q) {
      skipped += 1;
      continue;
    }
    rows.push({
      countryCode: code,
      countryName: countryNameForShippingRateKey(code),
      pricePerKg: q.freightRmbPerKg,
      deliveryFee: q.registrationFeeRmb,
    });
  }

  const auZones = [
    { rateKey: AU_SHIPPING_RATE_KEY_ZONE_12, postalCode: "2000", label: "Australia Zone 1-2" },
    { rateKey: AU_SHIPPING_RATE_KEY_ZONE_34, postalCode: "0800", label: "Australia Zone 3-4" },
  ];
  for (const zone of auZones) {
    const q = getShippingOhQuote({
      countryCode: "AU",
      postalCode: zone.postalCode,
      weightKg: WATCH_WEIGHT_KG,
      quantity: 1,
    });
    if (!q) {
      skipped += 1;
      continue;
    }
    rows.push({
      countryCode: zone.rateKey,
      countryName: zone.label,
      pricePerKg: q.freightRmbPerKg,
      deliveryFee: q.registrationFeeRmb,
    });
  }

  return { rows, skipped };
}

function buildSql(rows: Row[]): string {
  const statements: string[] = [];
  for (const row of rows) {
    statements.push(
      `INSERT INTO ShippingFeeRate (id, countryCode, countryName, shippingFeeCents, surchargeCents, deliveryDaysLabel, createdAt, updatedAt, pricePerKg, deliveryFee, dutyPercent)
       VALUES (${sqlString(cuidLike())}, ${sqlString(row.countryCode)}, ${sqlString(row.countryName)}, 0, 0, ${sqlString(SHIPPING_DEFAULTS.deliveryTime)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ${row.pricePerKg}, ${row.deliveryFee}, ${SHIPPING_DEFAULTS.dutyPercent})
       ON CONFLICT(countryCode) DO UPDATE SET
         countryName=excluded.countryName,
         pricePerKg=excluded.pricePerKg,
         deliveryFee=excluded.deliveryFee,
         dutyPercent=excluded.dutyPercent,
         updatedAt=CURRENT_TIMESTAMP;`,
    );
  }
  return statements.join("\n");
}

function applySqlite(sql: string) {
  execFileSync("sqlite3", [dbPath], { input: sql, stdio: ["pipe", "inherit", "inherit"] });
}

function applyD1(sql: string, local: boolean) {
  const tmp = path.join(os.tmpdir(), `humpbuck-oh-shipping-${Date.now()}.sql`);
  fs.writeFileSync(tmp, sql, "utf8");
  const flag = local ? "--local" : "--remote";
  const result = spawnSync(
    "npx",
    ["wrangler", "d1", "execute", "humpbuck-site", flag, `--file=${tmp}`],
    { encoding: "utf-8", shell: true },
  );
  fs.unlinkSync(tmp);
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  if (output) console.log(output);
  if (result.status !== 0) {
    throw new Error(
      `wrangler d1 execute failed (${flag}). If remote says database not found, log wrangler into the humpbuck Cloudflare account (R2 account id in .env.local), then retry.`,
    );
  }
}

function sampleQuery(target: Target) {
  const sql =
    "SELECT countryCode, pricePerKg, deliveryFee, dutyPercent, printf('%.2f', pricePerKg*0.3+deliveryFee) AS oneWatchFlat FROM ShippingFeeRate WHERE countryCode IN ('AL','JP','KZ','US','GB','AU-Z1-2','AU-Z3-4') ORDER BY countryCode;";
  if (target === "sqlite") {
    return execFileSync("sqlite3", [dbPath, sql], { encoding: "utf8" });
  }
  const flag = target === "d1-local" ? "--local" : "--remote";
  const tmp = path.join(os.tmpdir(), `humpbuck-oh-sample-${Date.now()}.sql`);
  fs.writeFileSync(tmp, sql, "utf8");
  try {
    const result = spawnSync(
      "npx",
      ["wrangler", "d1", "execute", "humpbuck-site", flag, `--file=${tmp}`],
      { encoding: "utf-8", shell: true },
    );
    return `${result.stdout ?? ""}
${result.stderr ?? ""}`.trim();
  } finally {
    fs.unlinkSync(tmp);
  }
}

function main() {
  const target = parseTarget();
  const { rows, skipped } = collectRows();
  const sql = buildSql(rows);

  if (target === "sqlite") applySqlite(sql);
  else if (target === "d1-local") applyD1(sql, true);
  else applyD1(sql, false);

  const sample = sampleQuery(target);
  console.log(
    JSON.stringify(
      {
        target,
        dbPath: target === "sqlite" ? dbPath : `d1:${target}`,
        watchWeightKg: WATCH_WEIGHT_KG,
        upserted: rows.length,
        skippedNoOhTier: skipped,
        sample,
      },
      null,
      2,
    ),
  );
}

main();
