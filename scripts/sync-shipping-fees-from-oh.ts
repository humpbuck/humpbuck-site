/**
 * Upsert humpbuck ShippingFeeRate rows from Cainiao OH tiers into local sqlite.
 * ¥/kg = freightRmbPerKg, 派送费 = registrationFeeRmb at WATCH_WEIGHT_KG; 税费% = 4.
 *
 *   npx tsx scripts/sync-shipping-fees-from-oh.ts
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { getShippingOhQuote } from "../lib/shipping-oh";
import { SHIPPING_DEFAULTS, WATCH_WEIGHT_KG } from "../lib/shipping-fee";
import {
  AU_SHIPPING_RATE_KEY_ZONE_12,
  AU_SHIPPING_RATE_KEY_ZONE_34,
  countryNameForShippingRateKey,
  listShippingFeeCountryOptions,
} from "../lib/shipping-fee-country-options";

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

function main() {
  const { rows, skipped } = collectRows();
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
  const sql = statements.join("\n");
  execFileSync("sqlite3", [dbPath], { input: sql, stdio: ["pipe", "inherit", "inherit"] });

  const sample = execFileSync(
    "sqlite3",
    [
      dbPath,
      "SELECT countryCode, pricePerKg, deliveryFee, dutyPercent, printf('%.2f', pricePerKg*0.3+deliveryFee) AS oneWatch FROM ShippingFeeRate WHERE countryCode IN ('AL','AO','AR','US','GB','AU-Z1-2','AU-Z3-4') ORDER BY countryCode;",
    ],
    { encoding: "utf8" },
  );

  console.log(
    JSON.stringify(
      {
        dbPath,
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
