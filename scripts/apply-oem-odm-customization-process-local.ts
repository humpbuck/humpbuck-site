import { createLocalFilePrismaClient } from "../lib/prisma-local";

const MIGRATION = "20260714170000_site_oem_odm_customization_process";

async function main() {
  const p = createLocalFilePrismaClient();

  const cols = await p.$queryRaw<{ name: string }[]>`
    PRAGMA table_info("SiteOemOdmContent")
  `;
  const names = cols.map((c) => c.name);

  if (!names.includes("customizationProcessHeading")) {
    await p.$executeRawUnsafe(
      `ALTER TABLE "SiteOemOdmContent" ADD COLUMN "customizationProcessHeading" TEXT NOT NULL DEFAULT ''`,
    );
    console.log("Added customizationProcessHeading");
  }

  if (!names.includes("customizationProcessText")) {
    await p.$executeRawUnsafe(
      `ALTER TABLE "SiteOemOdmContent" ADD COLUMN "customizationProcessText" TEXT NOT NULL DEFAULT ''`,
    );
    console.log("Added customizationProcessText");
  }

  if (
    names.includes("customizationProcessHeading") &&
    names.includes("customizationProcessText")
  ) {
    console.log("Customization process columns already exist — skipping.");
  } else {
    console.log(`Applied ${MIGRATION}`);
  }

  await p.$disconnect();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
