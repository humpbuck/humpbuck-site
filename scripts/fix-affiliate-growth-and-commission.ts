/**
 * Recompute growth tiers for all affiliates and normalize open ledger commission rates.
 *
 * - Tier target is based on paid commission order count milestones.
 * - Open ledgers (pending/eligible, not paid/reversed) are rewritten to the
 *   affiliate's current growth tier percent so settlement math matches tier.
 *
 * Usage:
 *   npx tsx scripts/fix-affiliate-growth-and-commission.ts
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import {
  countAffiliatePaidCommissionOrders,
  ensureAffiliateGrowthTiers,
} from "@/lib/affiliate-tier-growth";

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

function tierNameForPaidCount(paidCount: number): string {
  if (paidCount >= 1500) return "Level 6";
  if (paidCount >= 1000) return "Level 5";
  if (paidCount >= 600) return "Level 4";
  if (paidCount >= 300) return "Level 3";
  if (paidCount >= 100) return "Level 2";
  return "Level 1";
}

async function main() {
  await ensureAffiliateGrowthTiers();

  const tiers = await prisma.affiliateTier.findMany({
    where: { commissionType: "percent" },
    select: { id: true, name: true, commissionValue: true, isDefault: true },
  });
  const tierByName = new Map(tiers.map((t) => [t.name, t]));
  const defaultTier = tiers.find((t) => t.isDefault) ?? tierByName.get("Level 1");
  if (!defaultTier) throw new Error("Default/Level 1 affiliate tier not found.");

  const profiles = await prisma.affiliateProfile.findMany({
    select: { id: true, tierId: true },
  });

  let tierUpdated = 0;
  let ledgerUpdated = 0;

  for (const profile of profiles) {
    const paidCount = await countAffiliatePaidCommissionOrders(profile.id);
    const targetTier = tierByName.get(tierNameForPaidCount(paidCount)) ?? defaultTier;

    if (profile.tierId !== targetTier.id) {
      await prisma.affiliateProfile.update({
        where: { id: profile.id },
        data: { tierId: targetTier.id },
      });
      tierUpdated += 1;
    }

    const openLedgers = await prisma.affiliateCommissionLedger.findMany({
      where: {
        affiliateId: profile.id,
        status: { in: ["pending", "eligible"] },
        paidAt: null,
        reversedAt: null,
      },
      select: {
        id: true,
        orderTotalCents: true,
        commissionValue: true,
        commissionCents: true,
      },
    });

    for (const ledger of openLedgers) {
      const nextCents = Math.round((ledger.orderTotalCents * targetTier.commissionValue) / 100);
      if (ledger.commissionValue === targetTier.commissionValue && ledger.commissionCents === nextCents) {
        continue;
      }
      await prisma.affiliateCommissionLedger.update({
        where: { id: ledger.id },
        data: {
          commissionType: "percent",
          commissionValue: targetTier.commissionValue,
          commissionCents: nextCents,
        },
      });
      ledgerUpdated += 1;
    }
  }

  console.log(
    `Affiliate commission repair complete. Profiles checked: ${profiles.length}, tiers updated: ${tierUpdated}, open ledgers updated: ${ledgerUpdated}.`,
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
