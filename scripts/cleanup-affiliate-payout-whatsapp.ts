/**
 * Remove legacy embedded "WhatsApp: ..." fragments from AffiliateProfile.payoutAccount.
 *
 * Run:
 *   npx tsx scripts/cleanup-affiliate-payout-whatsapp.ts
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { stripEmbeddedWhatsAppFromPayoutAccount } from "@/lib/affiliate-payout-account";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.affiliateProfile.findMany({
    select: {
      id: true,
      payoutAccount: true,
    },
  });

  let scanned = 0;
  let updated = 0;

  for (const profile of profiles) {
    scanned += 1;
    const before = String(profile.payoutAccount ?? "").trim();
    const after = stripEmbeddedWhatsAppFromPayoutAccount(before);
    if (before === after) continue;

    await prisma.affiliateProfile.update({
      where: { id: profile.id },
      data: {
        payoutAccount: after || null,
      },
    });
    updated += 1;
  }

  console.log(
    `Affiliate payout cleanup done. Scanned: ${scanned}, Updated: ${updated}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
