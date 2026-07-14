import fs from "node:fs";
import path from "node:path";
import { createLocalFilePrismaClient } from "../lib/prisma-local";

const BASE_MIGRATION = "20260714120000_site_oem_odm_content";

/** All columns after the base table create (order matters for legacy renames). */
const OEM_ODM_COLUMNS = [
  "moqRowsJson",
  "samplePolicyText",
  "samplePolicyHeading",
  "customizationProcessHeading",
  "customizationProcessText",
  "paymentTermsHeading",
  "paymentTermsText",
  "logisticsShippingHeading",
  "logisticsShippingText",
] as const;

async function tableColumns(p: ReturnType<typeof createLocalFilePrismaClient>): Promise<string[]> {
  const cols = await p.$queryRaw<{ name: string }[]>`
    PRAGMA table_info("SiteOemOdmContent")
  `;
  return cols.map((c) => c.name);
}

async function addColumn(
  p: ReturnType<typeof createLocalFilePrismaClient>,
  col: string,
): Promise<void> {
  await p.$executeRawUnsafe(
    `ALTER TABLE "SiteOemOdmContent" ADD COLUMN "${col}" TEXT NOT NULL DEFAULT ''`,
  );
  console.log(`Added column ${col}`);
}

async function main() {
  const p = createLocalFilePrismaClient();

  const existing = await p.$queryRaw<{ name: string }[]>`
    SELECT name FROM sqlite_master WHERE type='table' AND name='SiteOemOdmContent'
  `;

  if (existing.length === 0) {
    const sqlPath = path.join("prisma", "migrations", BASE_MIGRATION, "migration.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    for (const statement of sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)) {
      await p.$executeRawUnsafe(statement);
      console.log("OK:", statement.split("\n")[0].slice(0, 80));
    }
    console.log("Created SiteOemOdmContent table.");
  } else {
    console.log("SiteOemOdmContent table exists.");
  }

  let names = await tableColumns(p);

  if (names.includes("samplePolicyJson") && !names.includes("samplePolicyText")) {
    await p.$executeRawUnsafe(
      `ALTER TABLE "SiteOemOdmContent" RENAME COLUMN "samplePolicyJson" TO "samplePolicyText"`,
    );
    console.log("Renamed samplePolicyJson → samplePolicyText");
    names = await tableColumns(p);
  }

  for (const col of OEM_ODM_COLUMNS) {
    if (names.includes(col)) continue;
    await addColumn(p, col);
    names = await tableColumns(p);
  }

  console.log("SiteOemOdmContent columns:", names.join(", "));
  await p.$disconnect();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
