/**
 * Inserts two **paid** test orders (Saudi Arabia + Qatar) for admin / logistics checks.
 *
 *   npx tsx scripts/create-sa-qa-test-orders.ts
 *
 * Optional:
 *   FULFILLMENT_TEST_EMAIL — buyer email (default: humpbuck@outlook.com)
 *   GCC_TEST_SHIPPING_METHOD — cainiao | yanwen (default: cainiao)
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { adminPath } from "@/lib/admin-path";
import {
  CNY_PER_USD,
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

/** Must match `CHECKOUT_COUNTRIES[].value` (ISO English name in iso-3166-countries.json). */
const CASES = [
  {
    key: "sa",
    country: "Saudi Arabia",
    label: "SA test",
    address: () => ({
      firstName: "Test",
      lastName: "SA Buyer",
      fullName: "Test SA Buyer",
      line1: "King Fahd Rd",
      line2: "",
      city: "Riyadh",
      state: "Riyadh Province",
      postalCode: "11564",
      country: "Saudi Arabia",
      phone: "+966501234567",
    }),
  },
  {
    key: "qa",
    country: "Qatar",
    label: "QA test",
    address: () => ({
      firstName: "Test",
      lastName: "QA Buyer",
      fullName: "Test QA Buyer",
      line1: "West Bay",
      line2: "",
      city: "Doha",
      state: "",
      postalCode: "00000",
      country: "Qatar",
      phone: "+97433123456",
    }),
  },
] as const;

const QTY = 1;

async function main() {
  const email =
    process.env.FULFILLMENT_TEST_EMAIL?.trim() || "humpbuck@outlook.com";

  const methodRaw = (process.env.GCC_TEST_SHIPPING_METHOD || "cainiao").trim();
  const shippingMethod: ShippingMethodId = isShippingMethodId(methodRaw)
    ? methodRaw
    : "cainiao";

  const slug = "digitemp-2412m";
  const unitAmountCents = 999;
  const lineTotalCents = unitAmountCents * QTY;
  const declaredGoodsCny =
    Math.round((lineTotalCents / 100) * CNY_PER_USD * 100) / 100;

  const base = publicBaseUrl();
  const created: { id: string; country: string }[] = [];

  for (const c of CASES) {
    const billing = c.address();
    const shippingCountry = c.country;

    const shipQ = quoteCheckoutShipping({
      countryLabel: shippingCountry,
      totalUnits: QTY,
      method: shippingMethod,
      state: billing.state || null,
      postalCode: billing.postalCode || null,
      declaredGoodsCny,
    });
    if (!shipQ.ok) {
      console.error(`${c.key}: shipping quote failed:`, shipQ.error);
      process.exit(1);
    }

    const itemsJson = JSON.stringify([
      {
        slug,
        name: `HUMPBUCK — ${c.label} (script)`,
        qty: QTY,
        unitAmountCents,
        lineTotalCents,
        variantLabel: `${c.key}-test`,
      },
    ]);

    const shipping = {
      ...billing,
      country: shippingCountry,
      shippingMethod,
      shippingEstimateCny: String(shipQ.shippingCny),
    };

    const orderTotalCents = lineTotalCents + shipQ.shippingUsdCents;

    const order = await prisma.order.create({
      data: {
        email,
        status: "paid",
        provider: "stripe",
        providerRef: `${c.key}_test_${Date.now()}`,
        totalCents: orderTotalCents,
        itemsJson,
        billingJson: JSON.stringify(billing),
        shippingJson: JSON.stringify(shipping),
        orderNotes:
          "Created by scripts/create-sa-qa-test-orders.ts — delete after testing.",
        trafficSource: "direct",
      },
    });

    created.push({ id: order.id, country: shippingCountry });

    console.log("");
    console.log(`${c.key.toUpperCase()} test order created.`);
    console.log("  Order id:       ", order.id);
    console.log("  Display #:      ", order.id.slice(-6).toUpperCase());
    console.log("  Country:        ", shippingCountry);
    console.log("  Shipping method:", shippingMethod);
    console.log(
      "  Shipping (buyer):",
      `$${(shipQ.shippingUsdCents / 100).toFixed(2)}`,
      `(≈¥${shipQ.shippingCny.toFixed(2)} top-up)`,
    );
    console.log("  Order total:    ", `$${(orderTotalCents / 100).toFixed(2)}`);
    console.log("  Buyer email:    ", email);
    console.log("  Admin:", `${base}${adminPath(`/orders/${order.id}`)}`);
  }

  console.log("");
  console.log(`Done: ${created.length} orders for ${email}.`);
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
