/**
 * Inserts paid test orders across multiple destinations for shipping checks.
 *
 *   npx tsx scripts/create-multi-country-test-orders.ts
 *
 * Optional:
 *   FULFILLMENT_TEST_EMAIL — buyer email (default: humpbuck@outlook.com)
 *   MULTI_TEST_SHIPPING_METHOD — cainiao | yanwen (default: cainiao)
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

const CASES = [
  {
    key: "ro",
    country: "Romania",
    label: "RO test",
    address: () => ({
      firstName: "Test",
      lastName: "Romania",
      fullName: "Test Romania",
      line1: "Strada Test 1",
      line2: "",
      city: "Bucharest",
      state: "",
      postalCode: "010101",
      country: "Romania",
      phone: "+40700000001",
    }),
  },
  {
    key: "nz",
    country: "New Zealand",
    label: "NZ test",
    address: () => ({
      firstName: "Test",
      lastName: "NZ",
      fullName: "Test NZ",
      line1: "1 Test Street",
      line2: "",
      city: "Auckland",
      state: "Auckland",
      postalCode: "1010",
      country: "New Zealand",
      phone: "+64210000001",
    }),
  },
  {
    key: "sa",
    country: "Saudi Arabia",
    label: "SA test",
    address: () => ({
      firstName: "Test",
      lastName: "SA",
      fullName: "Test SA",
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
    key: "ae",
    country: "United Arab Emirates",
    label: "AE test",
    address: () => ({
      firstName: "Test",
      lastName: "AE",
      fullName: "Test AE",
      line1: "Sheikh Zayed Rd",
      line2: "",
      city: "Dubai",
      state: "Dubai",
      postalCode: "00000",
      country: "United Arab Emirates",
      phone: "+971500000001",
    }),
  },
  {
    key: "qa",
    country: "Qatar",
    label: "QA test",
    address: () => ({
      firstName: "Test",
      lastName: "QA",
      fullName: "Test QA",
      line1: "West Bay",
      line2: "",
      city: "Doha",
      state: "",
      postalCode: "00000",
      country: "Qatar",
      phone: "+97433123456",
    }),
  },
  {
    key: "kw",
    country: "Kuwait",
    label: "KW test",
    address: () => ({
      firstName: "Test",
      lastName: "KW",
      fullName: "Test KW",
      line1: "Block 1",
      line2: "",
      city: "Kuwait City",
      state: "",
      postalCode: "00000",
      country: "Kuwait",
      phone: "+96550000001",
    }),
  },
  {
    key: "bh",
    country: "Bahrain",
    label: "BH test",
    address: () => ({
      firstName: "Test",
      lastName: "BH",
      fullName: "Test BH",
      line1: "Manama Ave",
      line2: "",
      city: "Manama",
      state: "",
      postalCode: "00000",
      country: "Bahrain",
      phone: "+97336000001",
    }),
  },
  {
    key: "om",
    country: "Oman",
    label: "OM test",
    address: () => ({
      firstName: "Test",
      lastName: "OM",
      fullName: "Test OM",
      line1: "Sultan Qaboos St",
      line2: "",
      city: "Muscat",
      state: "",
      postalCode: "00000",
      country: "Oman",
      phone: "+96890000001",
    }),
  },
  {
    key: "ma",
    country: "Morocco",
    label: "MA test",
    address: () => ({
      firstName: "Test",
      lastName: "MA",
      fullName: "Test MA",
      line1: "Avenue Mohammed V",
      line2: "",
      city: "Casablanca",
      state: "",
      postalCode: "20000",
      country: "Morocco",
      phone: "+212600000001",
    }),
  },
  {
    key: "mx",
    country: "Mexico",
    label: "MX test",
    address: () => ({
      firstName: "Test",
      lastName: "MX",
      fullName: "Test MX",
      line1: "Av. Insurgentes",
      line2: "",
      city: "Mexico City",
      state: "CDMX",
      postalCode: "01000",
      country: "Mexico",
      phone: "+525500000001",
    }),
  },
  {
    key: "ar",
    country: "Argentina",
    label: "AR test",
    address: () => ({
      firstName: "Test",
      lastName: "AR",
      fullName: "Test AR",
      line1: "Av. Corrientes",
      line2: "",
      city: "Buenos Aires",
      state: "",
      postalCode: "C1043",
      country: "Argentina",
      phone: "+541100000001",
    }),
  },
  {
    key: "cl",
    country: "Chile",
    label: "CL test",
    address: () => ({
      firstName: "Test",
      lastName: "CL",
      fullName: "Test CL",
      line1: "Avenida Providencia",
      line2: "",
      city: "Santiago",
      state: "Región Metropolitana",
      postalCode: "7500000",
      country: "Chile",
      phone: "+56220000001",
      taxId: "12345678K",
    }),
  },
  {
    key: "jo",
    country: "Jordan",
    label: "JO test",
    address: () => ({
      firstName: "Test",
      lastName: "JO",
      fullName: "Test JO",
      line1: "Queen Rania St",
      line2: "",
      city: "Amman",
      state: "",
      postalCode: "11181",
      country: "Jordan",
      phone: "+962790000001",
    }),
  },
  {
    key: "ao",
    country: "Angola",
    label: "AO test",
    address: () => ({
      firstName: "Test",
      lastName: "AO",
      fullName: "Test AO",
      line1: "Rua Rainha Ginga",
      line2: "",
      city: "Luanda",
      state: "",
      postalCode: "00000",
      country: "Angola",
      phone: "+244930000001",
    }),
  },
  {
    key: "rw",
    country: "Rwanda",
    label: "RW test",
    address: () => ({
      firstName: "Test",
      lastName: "RW",
      fullName: "Test RW",
      line1: "KG 7 Ave",
      line2: "",
      city: "Kigali",
      state: "",
      postalCode: "00000",
      country: "Rwanda",
      phone: "+250780000001",
    }),
  },
] as const;

const QTY = 1;

async function main() {
  const email = process.env.FULFILLMENT_TEST_EMAIL?.trim() || "humpbuck@outlook.com";
  const methodRaw = (process.env.MULTI_TEST_SHIPPING_METHOD || "cainiao").trim();
  const shippingMethod: ShippingMethodId = isShippingMethodId(methodRaw) ? methodRaw : "cainiao";
  const slug = "digitemp-2412m";
  const unitAmountCents = 999;
  const lineTotalCents = unitAmountCents * QTY;
  const base = publicBaseUrl();
  const created: { id: string; country: string }[] = [];

  for (const c of CASES) {
    const billing = c.address();
    const shipQ = quoteCheckoutShipping({
      countryLabel: c.country,
      totalUnits: QTY,
      method: shippingMethod,
      state: billing.state || null,
      postalCode: billing.postalCode || null,
    });
    if (!shipQ.ok) {
      console.warn(`${c.key}: shipping quote failed, skipped:`, shipQ.error);
      continue;
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
      country: c.country,
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
          "Created by scripts/create-multi-country-test-orders.ts — delete after testing.",
        trafficSource: "direct",
      },
    });

    created.push({ id: order.id, country: c.country });

    console.log("");
    console.log(`${c.key.toUpperCase()} test order created.`);
    console.log("  Order id:       ", order.id);
    console.log("  Display #:      ", order.id.slice(-6).toUpperCase());
    console.log("  Country:        ", c.country);
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
