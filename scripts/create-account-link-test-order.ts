/**
 * Creates a **paid** test order linked to an existing user (by email) so you can test
 * My Account → Orders → Change shipping address and merchant notification email.
 *
 * Usage:
 *   npx tsx scripts/create-account-link-test-order.ts
 *   npx tsx scripts/create-account-link-test-order.ts 843574506@qq.com
 *   npx tsx scripts/create-account-link-test-order.ts 843574506@qq.com --different-addresses
 *     (billing ≠ shipping — for My Account order detail UI)
 *
 * Requires: user must already exist (signed up at least once). Loads .env.local via @next/env.
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const DEFAULT_EMAIL = "843574506@qq.com";

function publicBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

async function main() {
  const argv = process.argv.slice(2);
  const differentAddresses = argv.includes("--different-addresses");
  const email = (
    argv.find((a) => a !== "--different-addresses") || DEFAULT_EMAIL
  )
    .trim()
    .toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) {
    console.error(
      `\nNo user with email "${email}". Sign up / log in once on the site first, then re-run.\n`,
    );
    process.exit(1);
  }

  const slug = "digitemp-2412m";
  const items = [
    {
      productSlug: slug,
      productName: "HUMPBUCK — account order test (script)",
      productImage: null,
      variantId: null,
      variantLabel: "address-test",
      variantImage: null,
      qty: 1,
      unitPriceCents: 100,
      lineTotalCents: 100,
      currency: "usd",
      productSnapshotJson: null,
    },
  ];

  const shippingAddr = {
    firstName: "Test",
    lastName: "Buyer",
    fullName: "Test Buyer",
    line1: "742 Evergreen Terrace",
    line2: "",
    city: "Springfield",
    state: "IL",
    postalCode: "62701",
    country: "United States of America",
    phone: "+13125550100",
    shippingMethod: "cainiao",
    shippingEstimateCny: "0",
  };

  const billingAddr = differentAddresses
    ? {
        firstName: "Alex",
        lastName: "Payer",
        fullName: "Alex Payer",
        line1: "350 Fifth Avenue",
        line2: "Suite 100",
        city: "New York",
        state: "NY",
        postalCode: "10118",
        country: "United States of America",
        phone: "+12125550199",
        company: "Billing Co. LLC",
        shippingMethod: "cainiao",
        shippingEstimateCny: "0",
      }
    : { ...shippingAddr };

  const billingJson = JSON.stringify(billingAddr);
  const shippingJson = JSON.stringify(shippingAddr);

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      email: user.email ?? email,
      status: "paid",
      provider: "stripe",
      providerRef: `account_test_${Date.now()}`,
      totalCents: 100,
      billingJson,
      shippingJson,
      orderNotes: differentAddresses
        ? "Created by scripts/create-account-link-test-order.ts (--different-addresses) — safe to delete."
        : "Created by scripts/create-account-link-test-order.ts — safe to delete after testing.",
      trafficSource: "direct",
      items: {
        create: items,
      },
    },
  });

  const base = publicBaseUrl();
  const shortId = order.id.slice(-6).toUpperCase();

  console.log("");
  console.log(
    differentAddresses
      ? "Linked test order created (billing ≠ shipping)."
      : "Linked test order created.",
  );
  console.log("  User email:  ", email);
  console.log("  User id:     ", user.id);
  console.log("  Order id:    ", order.id);
  console.log("  Display #:   ", shortId);
  console.log("");
  console.log("Buyer:");
  console.log(`  ${base}/account/orders/${order.id}`);
  console.log("Admin:");
  console.log(`  ${base}/admin/ouhao/orders/${order.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
