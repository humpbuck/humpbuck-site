/**
 * Inserts two **paid** test orders: Australia + Yanwen zone 1 vs zone 3 (for admin / quote checks).
 *
 *   npx tsx scripts/create-au-zone-test-orders.ts
 *
 * Optional:
 *   FULFILLMENT_TEST_EMAIL — buyer email (default: humpbuck@outlook.com)
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { adminPath } from "@/lib/admin-path";
import { mergeDerivedLogisticsZone } from "@/lib/checkout-address";
import { quoteCheckoutShipping } from "@/lib/checkout-shipping-quote";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

function publicBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

/** Must match `CHECKOUT_COUNTRIES[].value`. */
const COUNTRY = "Australia";
const QTY = 1;
const SHIPPING_METHOD = "yanwen" as const;

function auAddress(postalCode: string, labelSuffix: string): Record<string, string> {
  return {
    firstName: "Test",
    lastName: `AU ${labelSuffix}`,
    fullName: `Test AU ${labelSuffix}`,
    line1: "1 Test Street",
    line2: "",
    city: "Sydney",
    state: "NSW",
    postalCode,
    country: COUNTRY,
    phone: "+61280000000",
  };
}

async function createOne(
  postalCode: string,
  zoneLabel: string,
  email: string,
  base: string,
) {
  const slug = "digitemp-2412m";
  const unitAmountCents = 999;
  const lineTotalCents = unitAmountCents * QTY;

  const shipQ = quoteCheckoutShipping({
    countryLabel: COUNTRY,
    totalUnits: QTY,
    method: SHIPPING_METHOD,
    postalCode,
  });
  if (!shipQ.ok) {
    console.error(`Postcode ${postalCode} quote failed:`, shipQ.error);
    process.exit(1);
  }

  const billing = auAddress(postalCode, zoneLabel);
  mergeDerivedLogisticsZone(billing);
  const shipping = {
    ...auAddress(postalCode, zoneLabel),
    shippingMethod: SHIPPING_METHOD,
    shippingEstimateCny: String(shipQ.shippingCny),
  };
  mergeDerivedLogisticsZone(shipping);

  const orderTotalCents = lineTotalCents + shipQ.shippingUsdCents;

  const order = await prisma.order.create({
    data: {
      email,
      status: "paid",
      provider: "stripe",
      providerRef: `au_pc${postalCode}_test_${Date.now()}`,
      totalCents: orderTotalCents,
      billingJson: JSON.stringify(billing),
      shippingJson: JSON.stringify(shipping),
      orderNotes: `Created by scripts/create-au-zone-test-orders.ts — AU postcode ${postalCode} (${zoneLabel}) — delete after testing.`,
      trafficSource: "direct",
      items: {
        create: [
          {
            productSlug: slug,
            productName: `HUMPBUCK — AU Yanwen ${zoneLabel} (script)`,
            productImage: null,
            variantId: null,
            variantLabel: `au-${postalCode}`,
            variantImage: null,
            qty: QTY,
            unitPriceCents,
            lineTotalCents,
            currency: "usd",
            productSnapshotJson: null,
          },
        ],
      },
    },
  });

  const shortId = order.id.slice(-6).toUpperCase();
  console.log("");
  console.log(`Australia · Yanwen · ${zoneLabel} · ${postalCode}`);
  console.log("  Order id:       ", order.id);
  console.log("  Display #:      ", shortId);
  console.log(
    "  Shipping (buyer):",
    `$${(shipQ.shippingUsdCents / 100).toFixed(2)}`,
    `(≈¥${shipQ.shippingCny.toFixed(2)} top-up)`,
  );
  console.log("  Order total:    ", `$${(orderTotalCents / 100).toFixed(2)}`);
  console.log("  Admin:          ", `${base}${adminPath(`/orders/${order.id}`)}`);
}

async function main() {
  const email =
    process.env.FULFILLMENT_TEST_EMAIL?.trim() || "humpbuck@outlook.com";
  const base = publicBaseUrl();

  await createOne("2000", "zone 1", email, base);
  await createOne("4350", "zone 3", email, base);

  console.log("");
  console.log("Done. Buyer email:", email);
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
