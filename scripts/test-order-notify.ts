/**
 * Creates a paid test order in the DB and triggers the merchant Brevo email once.
 * Run from repo root: npx tsx scripts/test-order-notify.ts
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { notifyCustomerOrderPaid, notifyMerchantOrderPaid } from "../lib/merchant-order-email";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
  const slug = "digitemp-2412m";
  const recipientEmail = process.env.TEST_ORDER_EMAIL?.trim() || "test-order-script@example.com";

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
      email: recipientEmail,
      status: "paid",
      provider: "stripe",
      providerRef: `test_${Date.now()}`,
      totalCents: 999,
      billingJson,
      shippingJson,
      orderNotes: "Smoke test from scripts/test-order-notify.ts",
      trafficSource: "direct",
      items: {
        create: [
          {
            productSlug: slug,
            productName: "HUMPBUCK DIGITEMP Test Line (script)",
            productImage: null,
            variantId: null,
            variantLabel: "style-test",
            variantImage: null,
            qty: 1,
            unitPriceCents: 999,
            lineTotalCents: 999,
            currency: "usd",
            productSnapshotJson: null,
          },
        ],
      },
    },
  });

  console.log("Created paid order:", order.id);
  console.log("Recipient email:", recipientEmail);
  console.log("Display #:", order.id.slice(-6).toUpperCase());

  await notifyCustomerOrderPaid(order.id);
  console.log("customer notification sent");

  await notifyMerchantOrderPaid(order.id);
  console.log("merchant notification sent");

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
