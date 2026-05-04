/**
 * Inserts a **paid** test order with United Kingdom shipping for admin / logistics UI checks.
 *
 *   npx tsx scripts/create-uk-test-order.ts
 *
 * Optional:
 *   FULFILLMENT_TEST_EMAIL — buyer email (default: humpbuck@outlook.com)
 *   UK_TEST_SHIPPING_METHOD — cainiao | yanwen | dhl | … (default: cainiao)
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { adminPath } from "@/lib/admin-path";
import {
  isShippingMethodId,
  quoteCheckoutShipping,
  type ShippingMethodId,
} from "@/lib/checkout-shipping-quote";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

function publicBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

/** Must match `CHECKOUT_COUNTRIES[].value` (ISO English short name in our list). */
const COUNTRY = "United Kingdom of Great Britain and Northern Ireland";
const QTY = 1;

function ukAddress(): Record<string, string> {
  return {
    firstName: "Test",
    lastName: "UK Buyer",
    fullName: "Test UK Buyer",
    line1: "221B Baker Street",
    line2: "",
    city: "London",
    state: "England",
    postalCode: "NW1 6XE",
    country: COUNTRY,
    phone: "+442079460958",
  };
}

async function main() {
  const email =
    process.env.FULFILLMENT_TEST_EMAIL?.trim() || "humpbuck@outlook.com";

  const methodRaw = (process.env.UK_TEST_SHIPPING_METHOD || "cainiao").trim();
  const shippingMethod: ShippingMethodId = isShippingMethodId(methodRaw)
    ? methodRaw
    : "cainiao";

  const slug = "digitemp-2412m";
  const unitAmountCents = 999;
  const lineTotalCents = unitAmountCents * QTY;

  const shipQ = quoteCheckoutShipping({
    countryLabel: COUNTRY,
    totalUnits: QTY,
    method: shippingMethod,
  });
  if (!shipQ.ok) {
    console.error("Shipping quote failed:", shipQ.error);
    process.exit(1);
  }

  const itemsJson = JSON.stringify([
    {
      slug,
      name: "HUMPBUCK — UK test (script)",
      qty: QTY,
      unitAmountCents,
      lineTotalCents,
      variantLabel: "uk-test",
    },
  ]);

  const billing = ukAddress();
  const shipping = {
    ...ukAddress(),
    shippingMethod,
    shippingEstimateCny: String(shipQ.shippingCny),
  };

  const orderTotalCents = lineTotalCents + shipQ.shippingUsdCents;

  const order = await prisma.order.create({
    data: {
      email,
      status: "paid",
      provider: "stripe",
      providerRef: `uk_test_${Date.now()}`,
      totalCents: orderTotalCents,
      itemsJson,
      billingJson: JSON.stringify(billing),
      shippingJson: JSON.stringify(shipping),
      orderNotes:
        "Created by scripts/create-uk-test-order.ts — delete after testing.",
      trafficSource: "direct",
    },
  });

  const base = publicBaseUrl();
  const shortId = order.id.slice(-6).toUpperCase();

  console.log("");
  console.log("UK test order created.");
  console.log("  Order id:       ", order.id);
  console.log("  Display #:      ", shortId);
  console.log("  Country:        ", COUNTRY);
  console.log("  Shipping method:", shippingMethod);
  console.log(
    "  Shipping (buyer):",
    `$${(shipQ.shippingUsdCents / 100).toFixed(2)}`,
    `(≈¥${shipQ.shippingCny.toFixed(2)} top-up)`,
  );
  console.log("  Order total:    ", `$${(orderTotalCents / 100).toFixed(2)}`);
  console.log("  Buyer email:    ", email);
  console.log("");
  console.log("Admin:", `${base}${adminPath(`/orders/${order.id}`)}`);
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
