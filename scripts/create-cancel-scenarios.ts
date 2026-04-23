/**
 * Creates two test orders for the same account:
 *   1) Paid — use Account → Cancel to test “cancel after payment” (refund copy + admin refund).
 *   2) Pending payment — use Account → Cancel to test “cancel without payment” (no refund copy; admin has no refund button).
 *
 * Usage:
 *   npx tsx scripts/create-cancel-scenarios.ts
 *   npx tsx scripts/create-cancel-scenarios.ts 843574506@qq.com
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
  const email = (process.argv[2] || DEFAULT_EMAIL).trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) {
    console.error(
      `\nNo user with email "${email}". Sign up or log in once on the site first, then re-run.\n`,
    );
    process.exit(1);
  }

  const slug = "rm-m01";
  const itemsJson = JSON.stringify([
    {
      slug,
      name: "RM-M01 Tonneau Ultra-thin",
      qty: 1,
      unitAmountCents: 329_00,
      lineTotalCents: 329_00,
      variantId: "style01",
      variantLabel: "RM-M01: style01",
    },
  ]);

  const shippingAddr = {
    firstName: "Maria",
    lastName: "Ybarra",
    fullName: "Maria Ybarra",
    line1: "2067 E Muncie Ave",
    line2: "",
    city: "Fresno",
    state: "CA",
    postalCode: "93720",
    country: "United States of America",
    phone: "5595550199",
    shippingMethod: "cainiao",
    shippingEstimateCny: "0",
  };

  const billingAddr = {
    firstName: "Antonio",
    lastName: "Ybarra",
    fullName: "Antonio Ybarra",
    line1: "1200 Commerce Plaza",
    line2: "Suite 400",
    city: "Los Angeles",
    state: "CA",
    postalCode: "90017",
    country: "United States of America",
    phone: "5593500083",
    shippingMethod: "cainiao",
    shippingEstimateCny: "0",
  };

  const ts = Date.now();

  const paidOrder = await prisma.order.create({
    data: {
      userId: user.id,
      email: user.email ?? email,
      status: "paid",
      provider: "stripe",
      providerRef: `cancel_scenario_paid_${ts}`,
      totalCents: 329_00,
      itemsJson,
      billingJson: JSON.stringify(billingAddr),
      shippingJson: JSON.stringify(shippingAddr),
      orderNotes:
        "[scenario: paid then cancel] scripts/create-cancel-scenarios.ts — expect refund notice + admin Refund.",
      trafficSource: "direct",
    },
  });

  const unpaidOrder = await prisma.order.create({
    data: {
      userId: user.id,
      email: user.email ?? email,
      status: "pending_payment",
      provider: "stripe",
      providerRef: null,
      totalCents: 329_00,
      itemsJson,
      billingJson: JSON.stringify(billingAddr),
      shippingJson: JSON.stringify(shippingAddr),
      orderNotes:
        "[scenario: unpaid cancel] scripts/create-cancel-scenarios.ts — expect no refund notice; admin no Refund button.",
      trafficSource: "direct",
    },
  });

  const base = publicBaseUrl();

  console.log("");
  console.log("Two cancel-test orders created (sign in as this email):");
  console.log("  Email:     ", email);
  console.log("");
  console.log("1) Paid — cancel after payment (refund messaging + admin Refund):");
  console.log("   Order id:", paidOrder.id);
  console.log("   ", `${base}/account/orders/${paidOrder.id}`);
  console.log("");
  console.log("2) Pending payment — cancel without capture (no refund messaging):");
  console.log("   Order id:", unpaidOrder.id);
  console.log("   ", `${base}/account/orders/${unpaidOrder.id}`);
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
