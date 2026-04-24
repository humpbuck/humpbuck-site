/**
 * Demo order for admin UI preview. Re-run is a no-op if the demo row already exists (no auto-delete).
 * Run: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import { adminPath } from "../lib/admin-path";

const prisma = new PrismaClient();

const DEMO_REF = "demo_preview_seed";

async function main() {
  const existing = await prisma.order.findFirst({
    where: { providerRef: DEMO_REF },
  });
  if (existing) {
    console.log("Demo order already exists; skipping seed.");
    console.log("  id:", existing.id);
    console.log("  admin URL: " + adminPath(`/orders/${existing.id}`));
    console.log("  (Delete it in Admin if you need a fresh demo order.)");
    return;
  }

  const items = [
    {
      slug: "rm-m01",
      name: "RM-M01 Tonneau Ultra-thin",
      qty: 1,
      unitAmountCents: 329_00,
      lineTotalCents: 329_00,
      variantId: "style-01",
      variantLabel: "RM-M01: Style 01",
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
      billingJson: JSON.stringify({
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
      }),
      shippingJson: JSON.stringify({
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
      }),
      orderNotes: "Please leave package at front desk if no answer.",
      carrier: "USPS",
      trackingNumber: "LP1000043960094CN",
      trafficSource: "google",
    },
  });

  console.log("Demo order created.");
  console.log("  id:", order.id);
  console.log("  admin URL: " + adminPath(`/orders/${order.id}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
