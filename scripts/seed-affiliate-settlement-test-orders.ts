/**
 * Create settlement-test orders + affiliate commission ledgers for one affiliate.
 *
 * Usage:
 *   npx tsx scripts/seed-affiliate-settlement-test-orders.ts 843574506@qq.com
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

type OrderSeed = {
  orderStatus: string;
  ledgerStatus: "pending" | "eligible" | "paid" | "reversed";
  totalCents: number;
  daysAgo: number;
};

const ORDER_SEEDS: OrderSeed[] = [
  { orderStatus: "pending_payment", ledgerStatus: "pending", totalCents: 12900, daysAgo: 2 },
  { orderStatus: "paid", ledgerStatus: "pending", totalCents: 14900, daysAgo: 1 },
  { orderStatus: "processing", ledgerStatus: "eligible", totalCents: 18900, daysAgo: 8 },
  { orderStatus: "shipped", ledgerStatus: "eligible", totalCents: 23900, daysAgo: 14 },
  { orderStatus: "delivered", ledgerStatus: "eligible", totalCents: 25900, daysAgo: 35 },
  { orderStatus: "paid", ledgerStatus: "paid", totalCents: 27900, daysAgo: 42 },
  { orderStatus: "processing", ledgerStatus: "paid", totalCents: 31900, daysAgo: 50 },
  { orderStatus: "shipped", ledgerStatus: "paid", totalCents: 35900, daysAgo: 60 },
  { orderStatus: "cancelled", ledgerStatus: "reversed", totalCents: 19900, daysAgo: 28 },
  { orderStatus: "refunded", ledgerStatus: "reversed", totalCents: 22900, daysAgo: 33 },
];

function daysAgoDate(daysAgo: number): Date {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
}

async function main() {
  const email = String(process.argv[2] ?? "").trim().toLowerCase();
  if (!email) {
    throw new Error("Please provide affiliate user email. Example: npx tsx scripts/seed-affiliate-settlement-test-orders.ts 843574506@qq.com");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) throw new Error(`User not found by email: ${email}`);

  const affiliate = await prisma.affiliateProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, pid: true, payoutEmail: true },
  });
  if (!affiliate) throw new Error(`Affiliate profile not found for user: ${email}`);

  const providerPrefix = `aff_settle_test_${Date.now()}`;
  let createdOrders = 0;
  let createdLedgers = 0;

  for (let i = 0; i < ORDER_SEEDS.length; i += 1) {
    const seed = ORDER_SEEDS[i]!;
    const createdAt = daysAgoDate(seed.daysAgo);
    const deliveredAt = seed.orderStatus === "delivered" || seed.orderStatus === "refunded"
      ? new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000)
      : null;
    const shippedAt = seed.orderStatus === "shipped" || seed.orderStatus === "delivered" || seed.orderStatus === "refunded"
      ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)
      : null;

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        affiliateId: affiliate.id,
        affiliatePid: affiliate.pid ?? null,
        affiliateAttribution: "manual:test-seed",
        email: user.email ?? email,
        status: seed.orderStatus,
        provider: "stripe",
        providerRef: `${providerPrefix}_${i + 1}`,
        totalCents: seed.totalCents,
        currency: "usd",
        itemsJson: JSON.stringify([
          {
            slug: `settlement-test-${i + 1}`,
            name: `Settlement Test Product ${i + 1}`,
            qty: 1,
            unitAmountCents: seed.totalCents,
            lineTotalCents: seed.totalCents,
          },
        ]),
        billingJson: JSON.stringify({
          firstName: "Affiliate",
          lastName: "Tester",
          line1: "Test Street 1",
          city: "Shenzhen",
          state: "GD",
          postalCode: "518000",
          country: "China",
          phone: "+8618024290526",
        }),
        shippingJson: JSON.stringify({
          firstName: "Affiliate",
          lastName: "Tester",
          line1: "Test Street 1",
          city: "Shenzhen",
          state: "GD",
          postalCode: "518000",
          country: "China",
          phone: "+8618024290526",
        }),
        shippedAt,
        deliveredAt,
        refundedAt: seed.orderStatus === "refunded" ? new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000) : null,
        refundReason: seed.orderStatus === "refunded" ? "test_refund_seed" : null,
        refundAmountCents: seed.orderStatus === "refunded" ? seed.totalCents : null,
        createdAt,
      },
    });
    createdOrders += 1;

    const commissionCents = Math.round(seed.totalCents * 0.1);
    const eligibleAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const paidAt = seed.ledgerStatus === "paid"
      ? new Date(eligibleAt.getTime() + 24 * 60 * 60 * 1000)
      : null;
    const reversedAt = seed.ledgerStatus === "reversed"
      ? new Date(eligibleAt.getTime() + 12 * 60 * 60 * 1000)
      : null;

    await prisma.affiliateCommissionLedger.create({
      data: {
        affiliateId: affiliate.id,
        orderId: order.id,
        orderTotalCents: seed.totalCents,
        commissionType: "percent",
        commissionValue: 10,
        commissionCents,
        holdDays: 30,
        eligibleAt,
        status: seed.ledgerStatus,
        paidAt,
        reversedAt,
        reversedCommissionCents: seed.ledgerStatus === "reversed" ? commissionCents : 0,
        reversalReason: seed.ledgerStatus === "reversed" ? "test_reverse_seed" : null,
        paidNote: seed.ledgerStatus === "paid" ? "seeded as paid for settlement testing" : null,
      },
    });
    createdLedgers += 1;
  }

  console.log(`Seed complete for ${email}`);
  console.log(`Affiliate ID: ${affiliate.id}`);
  console.log(`Created orders: ${createdOrders}`);
  console.log(`Created ledgers: ${createdLedgers}`);
  console.log("Order status coverage: pending_payment, paid, processing, shipped, delivered, cancelled, refunded");
  console.log("Ledger status coverage: pending, eligible, paid, reversed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
