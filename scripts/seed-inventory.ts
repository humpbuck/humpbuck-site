/**
 * Seed initial inventory for all catalog products.
 * Sets default stock of 100 per product/variant.
 * Safe to re-run: uses upsert.
 *
 * Usage: npx tsx scripts/seed-inventory.ts
 */
import { prisma } from "../lib/prisma-script";

// Inline product/variant list to avoid importing catalog (which needs R2 env)
const PRODUCTS: { slug: string; variants: string[] }[] = [
  { slug: "digitemp-2301", variants: Array.from({ length: 10 }, (_, i) => `style-${String(i + 1).padStart(2, "0")}`) },
  { slug: "digitemp-2412m", variants: Array.from({ length: 6 }, (_, i) => `style-${String(i + 1).padStart(2, "0")}`) },
  { slug: "rm-m01", variants: Array.from({ length: 6 }, (_, i) => `style-${String(i + 1).padStart(2, "0")}`) },
  { slug: "rm-m02", variants: Array.from({ length: 6 }, (_, i) => `style-${String(i + 1).padStart(2, "0")}`) },
  { slug: "rm-m03", variants: Array.from({ length: 6 }, (_, i) => `style-${String(i + 1).padStart(2, "0")}`) },
  { slug: "rm-m04", variants: Array.from({ length: 6 }, (_, i) => `style-${String(i + 1).padStart(2, "0")}`) },
  { slug: "rm-m05", variants: Array.from({ length: 6 }, (_, i) => `style-${String(i + 1).padStart(2, "0")}`) },
  { slug: "rm-m06", variants: Array.from({ length: 6 }, (_, i) => `style-${String(i + 1).padStart(2, "0")}`) },
  { slug: "rm-m07", variants: Array.from({ length: 6 }, (_, i) => `style-${String(i + 1).padStart(2, "0")}`) },
  { slug: "rm-m08", variants: Array.from({ length: 6 }, (_, i) => `style-${String(i + 1).padStart(2, "0")}`) },
  { slug: "rm-m09", variants: Array.from({ length: 6 }, (_, i) => `style-${String(i + 1).padStart(2, "0")}`) },
  { slug: "rm-m10", variants: Array.from({ length: 6 }, (_, i) => `style-${String(i + 1).padStart(2, "0")}`) },
  { slug: "rd-excalibur01", variants: Array.from({ length: 6 }, (_, i) => `style-${String(i + 1).padStart(2, "0")}`) },
];

const DEFAULT_QUANTITY = 100;
const DEFAULT_LOW_STOCK = 5;

async function main() {
  let count = 0;
  for (const p of PRODUCTS) {
    if (p.variants.length > 0) {
      for (const v of p.variants) {
        await prisma.productInventory.upsert({
          where: { productSlug_variantId: { productSlug: p.slug, variantId: v } },
          create: {
            productSlug: p.slug,
            variantId: v,
            quantity: DEFAULT_QUANTITY,
            lowStockThreshold: DEFAULT_LOW_STOCK,
          },
          update: {}, // don't overwrite existing quantities
        });
        count++;
      }
    } else {
      await prisma.productInventory.upsert({
        where: { productSlug_variantId: { productSlug: p.slug, variantId: "" } },
        create: {
          productSlug: p.slug,
          variantId: "",
          quantity: DEFAULT_QUANTITY,
          lowStockThreshold: DEFAULT_LOW_STOCK,
        },
        update: {},
      });
      count++;
    }
  }
  console.log(`Seeded ${count} inventory records (default ${DEFAULT_QUANTITY} each).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
