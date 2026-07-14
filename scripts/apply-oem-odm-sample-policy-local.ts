import { createLocalFilePrismaClient } from "../lib/prisma-local";

const MIGRATION = "20260714160000_site_oem_odm_sample_policy_heading";

async function main() {
  const p = createLocalFilePrismaClient();

  const cols = await p.$queryRaw<{ name: string }[]>`
    PRAGMA table_info("SiteOemOdmContent")
  `;
  const names = cols.map((c) => c.name);

  if (names.includes("samplePolicyHeading")) {
    console.log("samplePolicyHeading already exists — skipping.");
    await p.$disconnect();
    return;
  }

  await p.$executeRawUnsafe(
    `ALTER TABLE "SiteOemOdmContent" ADD COLUMN "samplePolicyHeading" TEXT NOT NULL DEFAULT ''`,
  );
  console.log(`Applied ${MIGRATION}: added samplePolicyHeading to SiteOemOdmContent`);
  await p.$disconnect();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
