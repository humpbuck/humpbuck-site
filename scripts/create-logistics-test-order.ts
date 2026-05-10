/**
 * Creates one paid logistics test order for checkout / admin panel verification.
 *
 * Usage:
 *   npx tsx scripts/create-logistics-test-order.ts
 *
 * Optional env:
 *   FULFILLMENT_TEST_EMAIL — buyer email (default: 84374506@qq.com)
 *   TEST_COUNTRY            — country label (default: Kuwait)
 *   TEST_POSTAL_CODE        — postal code (default: 00000)
 *   TEST_SHIPPING_METHOD    — cainiao | yanwen (default: yanwen)
 *   TEST_QTY                — item quantity (default: 1)
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { adminPath } from "@/lib/admin-path";
import { mergeDerivedLogisticsZone } from "@/lib/checkout-address";
import { isShippingMethodId, quoteCheckoutShipping, type ShippingMethodId } from "@/lib/checkout-shipping-quote";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

function publicBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

function envInt(name: string, fallback: number): number {
  const v = Number.parseInt(String(process.env[name] ?? ""), 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

async function main() {
  const email = process.env.FULFILLMENT_TEST_EMAIL?.trim() || "84374506@qq.com";
  const country = process.env.TEST_COUNTRY?.trim() || "Kuwait";
  const postalCode = process.env.TEST_POSTAL_CODE?.trim() || "00000";
  const qty = envInt("TEST_QTY", 1);
  const methodRaw = (process.env.TEST_SHIPPING_METHOD || "cainiao").trim();
  const requestedMethod: ShippingMethodId = isShippingMethodId(methodRaw) ? methodRaw : "cainiao";
  const base = publicBaseUrl();

  const primaryQuote = quoteCheckoutShipping({
    countryLabel: country,
    totalUnits: qty,
    method: requestedMethod,
    postalCode,
  });

  const fallbackMethod: ShippingMethodId = requestedMethod === "cainiao" ? "yanwen" : "cainiao";
  const fallbackQuote = quoteCheckoutShipping({
    countryLabel: country,
    totalUnits: qty,
    method: fallbackMethod,
    postalCode,
  });

  if (!primaryQuote.ok && !fallbackQuote.ok) {
    throw new Error(`Shipping quote failed for both carriers: ${primaryQuote.ok ? "" : primaryQuote.error} ${fallbackQuote.ok ? "" : fallbackQuote.error}`.trim());
  }

  const shipQ = primaryQuote.ok ? primaryQuote : fallbackQuote;
  const shippingMethod: ShippingMethodId = primaryQuote.ok ? requestedMethod : fallbackMethod;

  const slug = "digitemp-2412m";
  const unitAmountCents = 999;
  const lineTotalCents = unitAmountCents * qty;
  const orderTotalCents = lineTotalCents + shipQ.shippingUsdCents;

  const billing = {
    firstName: "Test",
    lastName: country,
    fullName: `Test ${country}`,
    line1: "1 Test Street",
    line2: "",
    city: "Test City",
    state: "",
    postalCode,
    country,
    phone: "+10000000000",
  };
  mergeDerivedLogisticsZone(billing);

  const shipping = {
    ...billing,
    shippingMethod,
    shippingEstimateCny: String(shipQ.shippingCny),
  };
  mergeDerivedLogisticsZone(shipping);

  const order = await prisma.order.create({
    data: {
      email,
      status: "paid",
      provider: "stripe",
      providerRef: `logistics_test_${Date.now()}`,
      totalCents: orderTotalCents,
      itemsJson: JSON.stringify([
        {
          slug,
          name: `HUMPBUCK — Logistics test (${country})`,
          qty,
          unitAmountCents,
          lineTotalCents,
          variantLabel: `${country}-${shippingMethod}`,
        },
      ]),
      billingJson: JSON.stringify(billing),
      shippingJson: JSON.stringify(shipping),
      orderNotes: `Created by scripts/create-logistics-test-order.ts — ${country} (${shippingMethod}) — delete after testing.`,
      trafficSource: "direct",
    },
  });

  console.log("\nLogistics test order created.");
  console.log("  Order id:       ", order.id);
  console.log("  Display #:      ", order.id.slice(-6).toUpperCase());
  console.log("  Country:        ", country);
  console.log("  Postal code:    ", postalCode);
  console.log("  Shipping method:", shippingMethod);
  console.log("  Shipping (buyer):", `$${(shipQ.shippingUsdCents / 100).toFixed(2)}`, `(≈¥${shipQ.shippingCny.toFixed(2)} top-up)`);
  console.log("  Order total:    ", `$${(orderTotalCents / 100).toFixed(2)}`);
  console.log("  Buyer email:    ", email);
  console.log("  Admin:          ", `${base}${adminPath(`/orders/${order.id}`)}`);
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
