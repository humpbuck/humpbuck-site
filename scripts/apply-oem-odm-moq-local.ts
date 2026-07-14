import { createLocalFilePrismaClient } from "../lib/prisma-local";

const MIGRATION = "20260714130000_site_oem_odm_moq";

async function main() {
  const p = createLocalFilePrismaClient();

  const cols = await p.$queryRaw<{ name: string }[]>`
    PRAGMA table_info("SiteOemOdmContent")
  `;
  if (cols.some((c) => c.name === "moqRowsJson")) {
    console.log("moqRowsJson already exists — skipping.");
    await p.$disconnect();
    return;
  }

  await p.$executeRawUnsafe(
    `ALTER TABLE "SiteOemOdmContent" ADD COLUMN "moqRowsJson" TEXT NOT NULL DEFAULT ''`,
  );
  console.log(`Applied ${MIGRATION}: added moqRowsJson to SiteOemOdmContent`);
  await p.$disconnect();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
