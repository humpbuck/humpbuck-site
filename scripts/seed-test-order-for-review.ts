/**
 * Creates one order for a real account so you can test buyer reviews
 * (account → order detail → “Write review”).
 *
 *   npx tsx scripts/seed-test-order-for-review.ts
 *   TEST_REVIEW_ORDER_EMAIL=you@ex.com npx tsx scripts/seed-test-order-for-review.ts
 *
 * Requires: user already registered (we link `Order.userId`). Status is
 * `shipped` (eligible for reviews per `lib/review-eligibility.ts`).
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const DEFAULT_EMAIL = "843574506@qq.com";
const SLUG = "digitemp-2301";
const NAME = "DIGI-TEMP 2301";
const UNIT_CENTS = 2630;
const PROVIDER_PREFIX = "test_review_order";

const shipping = {
  firstName: "Test",
  lastName: "Buyer",
  fullName: "Test Buyer",
  line1: "1 Test St",
  line2: "",
  city: "Shanghai",
  state: "",
  postalCode: "200000",
  country: "China",
  phone: "+8613800138000",
};

async function main() {
  const email = (process.env.TEST_REVIEW_ORDER_EMAIL || DEFAULT_EMAIL)
    .trim()
    .toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(
      `No user with email ${email}. Register that account first, then re-run this script.`,
    );
    process.exit(1);
  }

  const ts = Date.now();
  const lineTotalCents = UNIT_CENTS;

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      email: user.email ?? email,
      status: "shipped",
      provider: "dev_seed",
      providerRef: `${PROVIDER_PREFIX}_${ts}`,
      totalCents: lineTotalCents,
      billingJson: JSON.stringify(shipping),
      shippingJson: JSON.stringify(shipping),
      orderNotes: `Test order for buyer review flow — ${PROVIDER_PREFIX}`,
      carrier: "Test Carrier",
      trackingNumber: `TEST${String(ts).slice(-10)}`,
      trafficSource: "unknown",
      items: {
        create: [
          {
            productSlug: SLUG,
            productName: NAME,
            productImage: null,
            variantId: "style-01",
            variantLabel: `${SLUG}: style-01`,
            variantImage: null,
            qty: 1,
            unitPriceCents: UNIT_CENTS,
            lineTotalCents,
            currency: "usd",
            productSnapshotJson: null,
          },
        ],
      },
    },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  console.log(`\nUser: ${email} (${user.id})`);
  console.log(`Order: ${order.id} — status=shipped, line=${SLUG}`);
  console.log(`\nOpen (logged in as ${email}):`);
  console.log(`  ${base}/account/orders/${order.id}`);
  console.log(`\nWrite review (direct):`);
  console.log(`  ${base}/account/orders/${order.id}/review/${SLUG}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
