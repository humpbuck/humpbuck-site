/**
 * Creates a **paid** test order linked to an **existing** user so you can test
 * Account → Cancel order and cancellation emails.
 *
 * Usage:
 *   npx tsx scripts/create-cancel-test-order.ts
 *   npx tsx scripts/create-cancel-test-order.ts 843574506@qq.com
 *
 * The user must already exist (signed up at least once). Loads .env.local via @next/env.
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { notifyMerchantOrderPaid } from "../lib/merchant-order-email";

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

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      email: user.email ?? email,
      status: "paid",
      provider: "stripe",
      providerRef: `cancel_test_${Date.now()}`,
      totalCents: 329_00,
      itemsJson,
      billingJson: JSON.stringify(billingAddr),
      shippingJson: JSON.stringify(shippingAddr),
      orderNotes:
        "Created by scripts/create-cancel-test-order.ts — cancel from account to test email.",
      trafficSource: "direct",
    },
  });

  await notifyMerchantOrderPaid(order.id);

  const base = publicBaseUrl();

  console.log("");
  console.log("Cancel-test order created for your account.");
  console.log("  Email:      ", email);
  console.log("  User id:    ", user.id);
  console.log("  Order id:   ", order.id);
  console.log("");
  console.log("Open (sign in as this email):");
  console.log("  ", `${base}/account/orders/${order.id}`);
  console.log("");
  console.log(
    "Merchant new-order email (Brevo): sent to MERCHANT_NOTIFY_EMAIL or humpbuck@outlook.com if BREVO_API_KEY + BREVO_SENDER_EMAIL are set.",
  );
  console.log(
    "Buyer receipt: use PayPal/Stripe — this script does not email the buyer.",
  );
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
