/**
 * Inserts 3 demo orders for admin UI (varied status + products).
 * Re-running **adds** three more orders — nothing is auto-deleted. Remove extras in Admin → Orders if needed.
 *
 *   npm run db:seed-demo-orders
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const PREFIX = "admin_demo_orders_v1";

const usShipping = {
  firstName: "Alex",
  lastName: "Rivera",
  fullName: "Alex Rivera",
  line1: "742 Evergreen Terrace",
  line2: "",
  city: "Springfield",
  state: "IL",
  postalCode: "62704",
  country: "United States of America",
  phone: "+12175550199",
};

async function main() {
  const ts = Date.now();
  const orders: Array<{
    status: string;
    slug: string;
    name: string;
    unitAmountCents: number;
    variantId?: string;
    carrier?: string;
    trackingNumber?: string;
  }> = [
    {
      status: "paid",
      slug: "digitemp-2301",
      name: "DIGI-TEMP 2301",
      unitAmountCents: 2630,
      variantId: "style-01",
    },
    {
      status: "processing",
      slug: "rm-m01",
      name: "RM-M01 Tonneau Ultra-thin",
      unitAmountCents: 329_00,
      variantId: "style01",
    },
    {
      status: "shipped",
      slug: "rd-excalibur01",
      name: "RD Excalibur Iced",
      unitAmountCents: 189_00,
      carrier: "USPS",
      trackingNumber: `DEMO${String(ts).slice(-10)}`,
    },
  ];

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

  for (let i = 0; i < orders.length; i++) {
    const o = orders[i]!;
    const lineTotalCents = o.unitAmountCents;
    const itemsJson = JSON.stringify([
      {
        slug: o.slug,
        name: o.name,
        qty: 1,
        unitAmountCents: o.unitAmountCents,
        lineTotalCents,
        variantId: o.variantId,
        variantLabel: o.variantId ? `${o.slug}: ${o.variantId}` : undefined,
      },
    ]);

    const order = await prisma.order.create({
      data: {
        email: `demo.buyer.${i + 1}@example.com`,
        status: o.status,
        provider: "stripe",
        providerRef: `${PREFIX}_${ts}_${i}`,
        totalCents: lineTotalCents,
        itemsJson,
        billingJson: JSON.stringify(usShipping),
        shippingJson: JSON.stringify(usShipping),
        orderNotes: `Demo order ${i + 1} of 3 — scripts/seed-admin-demo-orders.ts`,
        carrier: o.carrier ?? null,
        trackingNumber: o.trackingNumber ?? null,
        trafficSource: i === 0 ? "google" : i === 1 ? "direct" : "unknown",
      },
    });

    console.log(`  [${i + 1}] ${o.status.padEnd(12)} ${order.id} → ${base}/admin/orders/${order.id}`);
  }

  console.log(
    `\nCreated ${orders.length} demo orders (providerRef: ${PREFIX}_<timestamp>_*). Remove in Admin if you do not need them.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
