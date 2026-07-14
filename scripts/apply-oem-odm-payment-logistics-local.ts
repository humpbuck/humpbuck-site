import { createLocalFilePrismaClient } from "../lib/prisma-local";

const MIGRATION = "20260714180000_site_oem_odm_payment_logistics";
const COLUMNS = [
  "paymentTermsHeading",
  "paymentTermsText",
  "logisticsShippingHeading",
  "logisticsShippingText",
] as const;

async function main() {
  const p = createLocalFilePrismaClient();

  const cols = await p.$queryRaw<{ name: string }[]>`
    PRAGMA table_info("SiteOemOdmContent")
  `;
  const names = cols.map((c) => c.name);

  for (const col of COLUMNS) {
    if (names.includes(col)) {
      console.log(`${col} already exists — skipping.`);
      continue;
    }
    await p.$executeRawUnsafe(
      `ALTER TABLE "SiteOemOdmContent" ADD COLUMN "${col}" TEXT NOT NULL DEFAULT ''`,
    );
    console.log(`Added ${col}`);
  }

  console.log(`Applied ${MIGRATION}`);
  await p.$disconnect();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
