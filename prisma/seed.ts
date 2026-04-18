/**
 * Demo order for admin UI preview. Safe to re-run: removes prior seed by providerRef.
 * Run: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_REF = "demo_preview_seed";

async function main() {
  await prisma.order.deleteMany({ where: { providerRef: DEMO_REF } });

  const items = [
    {
      slug: "rm-m01",
      name: "RM-M01 Tonneau Ultra-thin",
      qty: 1,
      unitAmountCents: 329_00,
      lineTotalCents: 329_00,
      variantId: "style01",
      variantLabel: "RM-M01: style01",
    },
  ];

  const totalCents = items.reduce((s, l) => s + l.lineTotalCents, 0);

  const order = await prisma.order.create({
    data: {
      email: "preview.customer@example.com",
      status: "processing",
      provider: "stripe",
      providerRef: DEMO_REF,
      totalCents,
      itemsJson: JSON.stringify(items),
      shippingJson: JSON.stringify({
        fullName: "Antonio Ybarra",
        line1: "2067 E Muncie Ave",
        line2: "",
        city: "Fresno",
        state: "CA",
        postalCode: "93720",
        country: "United States",
        phone: "5593500083",
      }),
      carrier: "USPS",
      trackingNumber: "LP1000043960094CN",
      trafficSource: "google",
    },
  });

  console.log("Demo order created.");
  console.log("  id:", order.id);
  console.log(
    "  admin URL: /admin/orders/" + order.id,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
