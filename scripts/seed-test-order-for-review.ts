/**
 * Creates one order for a real account so you can test buyer reviews.
 *
 *   npm run db:seed-test-review-order
 *   TEST_REVIEW_ORDER_EMAIL=you@ex.com npm run db:seed-test-review-order
 *   TEST_REVIEW_PRODUCT_SLUG=2301 npm run db:seed-test-review-order
 *
 * Uses the first CatalogProduct in DB (override with TEST_REVIEW_PRODUCT_SLUG).
 * Default status: `shipped` — confirm receipt on the order page before reviewing.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());
/** Shell/IDE may set DATABASE_URL to localhost; for this script, `.env.local` wins. */
const el = join(process.cwd(), ".env.local");
if (existsSync(el)) {
  for (const line of readFileSync(el, "utf8").split("\n")) {
    const t = line.trim();
    if (!t.startsWith("DATABASE_URL=")) continue;
    let v = t.slice("DATABASE_URL=".length).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    process.env.DATABASE_URL = v;
    break;
  }
}

const prisma = new PrismaClient();

const DEFAULT_EMAIL = "843574506@qq.com";
const PROVIDER_PREFIX = "test_review_order";

const shipping = {
  firstName: "Test",
  lastName: "Buyer",
  fullName: "Test Buyer",
  line1: "1 Test St",
  line2: "",
  city: "Shanghai",
  state: "",
  postalCode: "200000",
  country: "China",
  phone: "+8613800138000",
};

type VariantRow = { id: string; label: string; image?: string };

function parseVariants(json: string | null): VariantRow[] {
  if (!json?.trim()) return [];
  try {
    const v = JSON.parse(json) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter(
      (x): x is VariantRow =>
        typeof x === "object" &&
        x != null &&
        typeof (x as VariantRow).id === "string" &&
        typeof (x as VariantRow).label === "string",
    );
  } catch {
    return [];
  }
}

async function resolveCatalogProduct() {
  const slugOverride = process.env.TEST_REVIEW_PRODUCT_SLUG?.trim();
  if (slugOverride) {
    const row = await prisma.catalogProduct.findUnique({ where: { slug: slugOverride } });
    if (!row) throw new Error(`CatalogProduct not found: ${slugOverride}`);
    return row;
  }
  const row = await prisma.catalogProduct.findFirst({
    orderBy: { slug: "asc" },
  });
  if (!row) {
    throw new Error(
      "No CatalogProduct in database. Add products in admin or run catalog seed first.",
    );
  }
  return row;
}

async function main() {
  const email = (process.env.TEST_REVIEW_ORDER_EMAIL || DEFAULT_EMAIL)
    .trim()
    .toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(
      `No user with email ${email}. Register that account first, then re-run this script.`,
    );
    process.exit(1);
  }

  const product = await resolveCatalogProduct();
  const variants = parseVariants(product.variantsJson);
  const variant = variants[0];
  const unitCents = Math.round(product.price * 100);
  const ts = Date.now();
  const shippedAt = new Date();

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      email: user.email ?? email,
      status: "shipped",
      provider: "dev_seed",
      providerRef: `${PROVIDER_PREFIX}_${ts}`,
      totalCents: unitCents,
      billingJson: JSON.stringify(shipping),
      shippingJson: JSON.stringify(shipping),
      orderNotes: `Test order for buyer review flow — ${PROVIDER_PREFIX}`,
      carrier: "Test Carrier",
      trackingNumber: `TEST${String(ts).slice(-10)}`,
      trafficSource: "unknown",
      shippedAt,
      items: {
        create: [
          {
            productSlug: product.slug,
            productName: product.name,
            productImage: product.image?.trim() || variant?.image?.trim() || null,
            variantId: variant?.id ?? null,
            variantLabel: variant?.label ?? null,
            variantImage: variant?.image?.trim() || null,
            qty: 1,
            unitPriceCents: unitCents,
            lineTotalCents: unitCents,
            currency: "usd",
            productSnapshotJson: null,
          },
        ],
      },
    },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  console.log(`\nUser: ${email} (${user.id})`);
  console.log(`Order: ${order.id} — status=shipped (paid & shipped), line=${product.slug}`);
  console.log(`Product: ${product.name}`);
  console.log(`\nOpen (logged in as ${email}):`);
  console.log(`  ${base}/account/orders/${order.id}`);
  console.log(`\n1) Click “Confirm received” on the order page`);
  console.log(`2) Then “Write review” or open PDP:`);
  console.log(`  ${base}/product/${product.slug}#buyer-reviews\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
