/**
 * Seed N paid-commission orders for a given affiliate user email.
 *
 * Usage:
 *   npx tsx scripts/seed-affiliate-paid-commission-orders.ts 843574506@qq.com 20
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

function daysAgoDate(daysAgo: number): Date {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
}

async function main() {
  const email = String(process.argv[2] ?? "").trim().toLowerCase();
  const count = Math.max(1, Number.parseInt(String(process.argv[3] ?? "20"), 10) || 20);

  if (!email) {
    throw new Error("Missing email. Example: npx tsx scripts/seed-affiliate-paid-commission-orders.ts 843574506@qq.com 20");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) throw new Error(`User not found: ${email}`);

  const affiliate = await prisma.affiliateProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, pid: true, tier: { select: { commissionValue: true } } },
  });
  if (!affiliate) throw new Error(`Affiliate profile not found for: ${email}`);

  const commissionPercent = affiliate.tier?.commissionValue ?? 5;
  const providerPrefix = `aff_paid_seed_${Date.now()}`;
  let created = 0;

  for (let i = 0; i < count; i += 1) {
    const totalCents = 9900 + i * 250;
    const createdAt = daysAgoDate(35 + i);
    const paidAt = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000);
    const shippedAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
    const deliveredAt = new Date(createdAt.getTime() + 36 * 60 * 60 * 1000);
    const commissionCents = Math.round((totalCents * commissionPercent) / 100);
    const eligibleAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        affiliateId: affiliate.id,
        affiliatePid: affiliate.pid ?? null,
        affiliateAttribution: "manual:paid-commission-seed",
        email: user.email ?? email,
        status: "paid",
        provider: "stripe",
        providerRef: `${providerPrefix}_${i + 1}`,
        totalCents,
        currency: "usd",
        billingJson: JSON.stringify({
          firstName: "Affiliate",
          lastName: "Tester",
          line1: "Seed Street 1",
          city: "Shenzhen",
          state: "GD",
          postalCode: "518000",
          country: "China",
          phone: "+8618024290526",
        }),
        shippingJson: JSON.stringify({
          firstName: "Affiliate",
          lastName: "Tester",
          line1: "Seed Street 1",
          city: "Shenzhen",
          state: "GD",
          postalCode: "518000",
          country: "China",
          phone: "+8618024290526",
        }),
        shippedAt,
        deliveredAt,
        createdAt,
        items: {
          create: [
            {
              productSlug: `paid-commission-seed-${i + 1}`,
              productName: `Paid Commission Seed Product ${i + 1}`,
              productImage: null,
              variantId: null,
              variantLabel: null,
              variantImage: null,
              qty: 1,
              unitPriceCents: totalCents,
              lineTotalCents: totalCents,
              currency: "usd",
              productSnapshotJson: null,
            },
          ],
        },
      },
    });

    await prisma.affiliateCommissionLedger.create({
      data: {
        affiliateId: affiliate.id,
        orderId: order.id,
        orderTotalCents: totalCents,
        commissionType: "percent",
        commissionValue: commissionPercent,
        commissionCents,
        holdDays: 30,
        eligibleAt,
        status: "paid",
        paidAt,
        paidNote: "seeded paid commission order",
      },
    });

    created += 1;
  }

  console.log(`Created ${created} paid commission orders for ${email}.`);
  console.log(`Affiliate ID: ${affiliate.id}, commissionPercent: ${commissionPercent}%`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
