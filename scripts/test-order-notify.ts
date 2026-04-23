/**
 * Creates a paid test order in the DB and triggers the merchant Brevo email once.
 * Run from repo root: npx tsx scripts/test-order-notify.ts
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { notifyMerchantOrderPaid } from "../lib/merchant-order-email";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
  const slug = "digitemp-2412m";
  const itemsJson = JSON.stringify([
    {
      slug,
      name: "HUMPBUCK DIGITEMP Test Line (script)",
      qty: 1,
      unitAmountCents: 999,
      lineTotalCents: 999,
      variantLabel: "style-test",
    },
  ]);

  const billingJson = JSON.stringify({
    fullName: "Test Buyer",
    company: "Test Co",
    line1: "123 Test Street",
    city: "São Paulo",
    state: "São Paulo",
    postalCode: "02919-090",
    country: "Brasil",
    phone: "+5585987998877",
  });

  const shippingJson = JSON.stringify({
    fullName: "Test Buyer",
    company: "Test Co",
    line1: "123 Test Street",
    city: "São Paulo",
    state: "São Paulo",
    postalCode: "02919-090",
    country: "Brasil",
  });

  const order = await prisma.order.create({
    data: {
      email: "test-order-script@example.com",
      status: "paid",
      provider: "stripe",
      providerRef: `test_${Date.now()}`,
      totalCents: 999,
      itemsJson,
      billingJson,
      shippingJson,
      orderNotes: "Smoke test from scripts/test-order-notify.ts",
      trafficSource: "direct",
    },
  });

  console.log("Created paid order:", order.id);
  console.log("Display #:", order.id.slice(-6).toUpperCase());

  await notifyMerchantOrderPaid(order.id);

  const updated = await prisma.order.findUnique({ where: { id: order.id } });
  console.log(
    "merchantNotifySentAt:",
    updated?.merchantNotifySentAt?.toISOString() ?? "(null — Brevo may be missing or failed)",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
