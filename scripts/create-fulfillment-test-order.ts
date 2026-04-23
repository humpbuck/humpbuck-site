/**
 * Inserts a **paid** test order with no carrier/tracking so you can exercise
 * the admin Fulfillment flow and the customer “shipped” email (Brevo).
 *
 * Run from repo root:
 *   npx tsx scripts/create-fulfillment-test-order.ts
 *
 * Optional env (see .env.local):
 *   DATABASE_URL
 *   FULFILLMENT_TEST_EMAIL — buyer email that will receive the shipped mail (default: humpbuck@outlook.com)
 *   NEXT_PUBLIC_APP_URL — printed admin link (default: http://localhost:3000)
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

function publicBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

async function main() {
  const email =
    process.env.FULFILLMENT_TEST_EMAIL?.trim() || "humpbuck@outlook.com";

  const slug = "digitemp-2412m";
  const itemsJson = JSON.stringify([
    {
      slug,
      name: "HUMPBUCK — fulfillment test (script)",
      qty: 1,
      unitAmountCents: 999,
      lineTotalCents: 999,
      variantLabel: "test-ship",
    },
  ]);

  const billingJson = JSON.stringify({
    fullName: "Fulfillment Test",
    line1: "1 Test Lane",
    city: "Hong Kong",
    postalCode: "00000",
    country: "Hong Kong",
  });

  const shippingJson = JSON.stringify({
    fullName: "Fulfillment Test",
    line1: "1 Test Lane",
    city: "Hong Kong",
    postalCode: "00000",
    country: "Hong Kong",
  });

  const order = await prisma.order.create({
    data: {
      email,
      status: "paid",
      provider: "stripe",
      providerRef: `fulfillment_test_${Date.now()}`,
      totalCents: 999,
      itemsJson,
      billingJson,
      shippingJson,
      orderNotes: "Created by scripts/create-fulfillment-test-order.ts — delete after testing.",
      trafficSource: "direct",
    },
  });

  const base = publicBaseUrl();
  const shortId = order.id.slice(-6).toUpperCase();

  console.log("");
  console.log("Test order created.");
  console.log("  Order id:     ", order.id);
  console.log("  Display #:    ", shortId);
  console.log("  Buyer email:  ", email, "  ← shipped email goes here");
  console.log("");
  console.log("Next steps (admin):");
  console.log("  1. Open:", `${base}/admin/orders/${order.id}`);
  console.log("  2. Set Order status to «Completed (shipped)».");
  console.log("  3. Choose Carrier from the dropdown.");
  console.log("  4. Paste your real tracking number.");
  console.log("  5. Save changes.");
  console.log("");
  console.log("If Brevo is configured, the buyer receives one «Your order has shipped» email.");
  console.log("Repeat test: create another order or clear customerShippedEmailSentAt in DB for this order.");
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
