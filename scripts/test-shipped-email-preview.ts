/**
 * Sends a sample "order shipped" email to preview the template (Brevo).
 * Run: npx tsx scripts/test-shipped-email-preview.ts
 *
 * Requires .env.local: BREVO_API_KEY, BREVO_SENDER_EMAIL, DATABASE_URL
 * Optional: REPEAT_PURCHASE_COUPON_CODE, NEXT_PUBLIC_APP_URL
 * Recipient: first CLI arg, otherwise defaults to humpbuck@outlook.com (not read from .env — avoids wrong PREVIEW_EMAIL).
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { buildCustomerShippedEmailPayload } from "../lib/customer-shipped-email";
import { sendTransactionalEmail } from "../lib/brevo-mail";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const DEFAULT_PREVIEW_EMAIL = "humpbuck@outlook.com";

const PREVIEW_TO = process.argv[2]?.trim() || DEFAULT_PREVIEW_EMAIL;

async function main() {
  const slug = "digitemp-2412m";
  const itemsJson = JSON.stringify([
    {
      slug,
      name: "HUMPBUCK DIGITEMP (preview)",
      qty: 1,
      unitAmountCents: 99900,
      lineTotalCents: 99900,
      variantLabel: "Preview",
    },
  ]);

  const shippingJson = JSON.stringify({
    fullName: "Preview Customer",
    line1: "123 Sample Street",
    city: "Hong Kong",
    postalCode: "00000",
    country: "Hong Kong",
  });

  const order = await prisma.order.create({
    data: {
      email: PREVIEW_TO,
      status: "shipped",
      provider: "stripe",
      providerRef: `preview_${Date.now()}`,
      totalCents: 99900,
      itemsJson,
      shippingJson,
      carrier: "DHL Express",
      trackingNumber: "1234567890",
      trafficSource: "direct",
    },
  });

  const payload = await buildCustomerShippedEmailPayload(order);

  const result = await sendTransactionalEmail({
    to: PREVIEW_TO,
    subject: `[Preview] ${payload.subject}`,
    htmlContent: payload.htmlContent,
    textContent: payload.textContent,
  });

  if (!result.ok) {
    console.error("Send failed:", result.error);
    process.exit(1);
  }

  console.log("Preview sent to", PREVIEW_TO);
  console.log("Shipped preview order left in DB:", order.id, "— delete in Admin if unwanted.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
