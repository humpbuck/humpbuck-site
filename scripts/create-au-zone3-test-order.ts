/**
 * Inserts one **paid** test order: Australia, postcode **4350** → lane **zone 3**
 * (verified in yanwen-postcode-zones.json). Uses **Cainiao** so admin shows
 * `澳大利亚/3区` and OH ≈ ¥63 @ 200g (vs zone 1 ≈ ¥32).
 *
 *   npx tsx scripts/create-au-zone3-test-order.ts
 *
 * Optional: FULFILLMENT_TEST_EMAIL
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { adminPath } from "@/lib/admin-path";
import { mergeDerivedLogisticsZone } from "@/lib/checkout-address";
import {
  CNY_PER_USD,
  quoteCheckoutShipping,
} from "@/lib/checkout-shipping-quote";
import { effectiveZonedLaneDigit, estimateLogistics } from "@/lib/logistics-estimate";
import { deriveYanwenLaneZoneDigit } from "@/lib/yanwen-postcode-zones";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const POSTAL = "4350";
const EXPECT_ZONE = "3";

function publicBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

async function main() {
  const d = deriveYanwenLaneZoneDigit("AU", POSTAL);
  if (d !== EXPECT_ZONE) {
    console.error(
      `Abort: postcode ${POSTAL} maps to zone ${d}, expected ${EXPECT_ZONE}. Re-export yanwen-postcode-zones.json if the sheet changed.`,
    );
    process.exit(1);
  }

  const est = estimateLogistics({
    countryLabel: "Australia",
    totalUnits: 1,
    postalCode: POSTAL,
  });
  if (est.cainiaoZhCountry !== `澳大利亚/${EXPECT_ZONE}区`) {
    console.error(
      "Abort: estimateLogistics cainiao row",
      est.cainiaoZhCountry,
      "expected 澳大利亚/3区",
    );
    process.exit(1);
  }

  const withStale = effectiveZonedLaneDigit("AU", POSTAL, "1");
  if (withStale !== EXPECT_ZONE) {
    console.error(
      "Abort: effectiveZonedLaneDigit should ignore stale stored zone 1, got",
      withStale,
    );
    process.exit(1);
  }

  console.log("Precheck OK:");
  console.log("  Postcode", POSTAL, "→ lane zone", d);
  console.log("  Cainiao zh:", est.cainiaoZhCountry);
  console.log("  OH int’l (CNY):", est.ohInternationalCny, "(expect ~63 @ 200g for zone 3)");

  const email =
    process.env.FULFILLMENT_TEST_EMAIL?.trim() || "humpbuck@outlook.com";
  const base = publicBaseUrl();
  const COUNTRY = "Australia";
  const QTY = 1;
  const METHOD = "cainiao" as const;

  const slug = "digitemp-2412m";
  const unitAmountCents = 999;
  const lineTotalCents = unitAmountCents * QTY;
  const declaredGoodsCny =
    Math.round((lineTotalCents / 100) * CNY_PER_USD * 100) / 100;

  const shipQ = quoteCheckoutShipping({
    countryLabel: COUNTRY,
    totalUnits: QTY,
    method: METHOD,
    postalCode: POSTAL,
    declaredGoodsCny,
  });
  if (!shipQ.ok) {
    console.error("quoteCheckoutShipping failed:", shipQ.error);
    process.exit(1);
  }

  function address(): Record<string, string> {
    return {
      firstName: "Test",
      lastName: "AU Zone3 Verify",
      fullName: "Test AU Zone3 Verify",
      line1: "1 Test Street",
      line2: "",
      city: "Example City",
      state: "Queensland",
      postalCode: POSTAL,
      country: COUNTRY,
      phone: "+61280000000",
    };
  }

  const billing = address();
  mergeDerivedLogisticsZone(billing);
  if (billing.logisticsZone !== EXPECT_ZONE) {
    console.error("billing logisticsZone", billing.logisticsZone);
    process.exit(1);
  }

  const shipping: Record<string, string> = {
    ...address(),
    shippingMethod: METHOD,
    shippingEstimateCny: String(shipQ.shippingCny),
  };
  mergeDerivedLogisticsZone(shipping);
  if (shipping.logisticsZone !== EXPECT_ZONE) {
    console.error("shipping logisticsZone", shipping.logisticsZone);
    process.exit(1);
  }

  const orderTotalCents = lineTotalCents + shipQ.shippingUsdCents;

  const order = await prisma.order.create({
    data: {
      email,
      status: "paid",
      provider: "stripe",
      providerRef: `au_z3_verify_${Date.now()}`,
      totalCents: orderTotalCents,
      itemsJson: JSON.stringify([
        {
          slug,
          name: "HUMPBUCK — AU zone 3 verify (4350 / Cainiao)",
          qty: QTY,
          unitAmountCents,
          lineTotalCents,
          variantLabel: "au-z3-verify",
        },
      ]),
      billingJson: JSON.stringify(billing),
      shippingJson: JSON.stringify(shipping),
      orderNotes: `AU zone 3 verification order — postcode ${POSTAL}, logisticsZone must be ${EXPECT_ZONE}. Delete after testing.`,
      trafficSource: "direct",
    },
  });

  console.log("");
  console.log("Created order", order.id);
  console.log("  Admin:", `${base}${adminPath(`/orders/${order.id}`)}`);
  console.log("  logisticsZone on shipping JSON:", shipping.logisticsZone);
  console.log(
    "  Buyer shipping USD:",
    (shipQ.shippingUsdCents / 100).toFixed(2),
    " CNY top-up:",
    shipQ.shippingCny.toFixed(2),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
