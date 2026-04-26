import { prisma } from "@/lib/prisma";

const GROWTH_TIERS: Array<{ name: string; commissionValue: number; minOrders: number; isDefault: boolean }> = [
  { name: "Level 1", commissionValue: 5, minOrders: 0, isDefault: true },
  { name: "Level 2", commissionValue: 7, minOrders: 100, isDefault: false },
  { name: "Level 3", commissionValue: 9, minOrders: 300, isDefault: false },
  { name: "Level 4", commissionValue: 11, minOrders: 600, isDefault: false },
  { name: "Level 5", commissionValue: 13, minOrders: 1000, isDefault: false },
  { name: "Level 6", commissionValue: 15, minOrders: 1500, isDefault: false },
];

function growthTierNameForPaidCommissionCount(paidCommissionOrderCount: number): string {
  if (paidCommissionOrderCount >= 1500) return "Level 6";
  if (paidCommissionOrderCount >= 1000) return "Level 5";
  if (paidCommissionOrderCount >= 600) return "Level 4";
  if (paidCommissionOrderCount >= 300) return "Level 3";
  if (paidCommissionOrderCount >= 100) return "Level 2";
  return "Level 1";
}

/**
 * Ensure the growth tiers exist.
 * Level 1 starts at 5%, and upgrades by order milestones.
 */
export async function ensureAffiliateGrowthTiers(): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const upserted = await Promise.all(
      GROWTH_TIERS.map((tier) =>
        tx.affiliateTier.upsert({
          where: { name: tier.name },
          create: {
            name: tier.name,
            commissionType: "percent",
            commissionValue: tier.commissionValue,
            isDefault: tier.isDefault,
          },
          update: {
            commissionType: "percent",
            commissionValue: tier.commissionValue,
          },
          select: { id: true, name: true },
        }),
      ),
    );

    const level1 = upserted.find((x) => x.name === "Level 1");
    if (!level1) {
      throw new Error("Failed to initialize Level 1 affiliate tier.");
    }

    // Keep exactly one default growth tier.
    await tx.affiliateTier.updateMany({ data: { isDefault: false } });
    await tx.affiliateTier.update({
      where: { id: level1.id },
      data: { isDefault: true },
    });

    // Migrate legacy Starter users to Level 1.
    const legacyStarter = await tx.affiliateTier.findUnique({
      where: { name: "Starter" },
      select: { id: true },
    });
    if (legacyStarter) {
      await tx.affiliateProfile.updateMany({
        where: { tierId: legacyStarter.id },
        data: { tierId: level1.id },
      });
      await tx.affiliateTier.update({
        where: { id: legacyStarter.id },
        data: { isDefault: false },
      });
    }

    return level1.id;
  });
}

/**
 * Count paid commission orders (ledger status=paid) for growth tier rules.
 */
export async function countAffiliatePaidCommissionOrders(
  affiliateId: string,
): Promise<number> {
  if (!affiliateId) return 0;
  return prisma.affiliateCommissionLedger.count({
    where: {
      affiliateId,
      status: "paid",
      paidAt: { not: null },
      commissionCents: { gt: 0 },
    },
  });
}

/**
 * Auto-upgrade/downgrade affiliate growth tier by paid commission order count.
 */
export async function syncAffiliateGrowthTierByOrderCount(
  affiliateId: string,
): Promise<void> {
  if (!affiliateId) return;
  await ensureAffiliateGrowthTiers();
  const paidCommissionOrderCount = await countAffiliatePaidCommissionOrders(affiliateId);
  const targetTierName = growthTierNameForPaidCommissionCount(paidCommissionOrderCount);
  const targetTier = await prisma.affiliateTier.findUnique({
    where: { name: targetTierName },
    select: { id: true },
  });
  if (!targetTier) return;
  await prisma.affiliateProfile.updateMany({
    where: {
      id: affiliateId,
      blacklist: false,
      status: { not: "pending" },
      OR: [{ tierId: null }, { tierId: { not: targetTier.id } }],
    },
    data: { tierId: targetTier.id },
  });
}
