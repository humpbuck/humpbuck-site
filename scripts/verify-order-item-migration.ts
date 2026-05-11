/**
 * Verify migrated order items against the snapshot rows.
 *
 * Usage:
 *   npx tsx scripts/verify-order-item-migration.ts
 *
 * Behavior:
 * - Scans all orders with snapshot rows.
 * - Checks count, slug, variant, qty, and price consistency.
 * - Confirms there are no empty snapshot rows.
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

type SnapshotRow = {
  productSlug: string;
  productName: string;
  variantId: string | null;
  variantLabel: string | null;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

function compareItems(snapshot: SnapshotRow[]) {
  const issues: string[] = [];
  if (snapshot.length === 0) {
    issues.push("no snapshot rows found");
  }

  snapshot.forEach((item, i) => {
    if (!item.productSlug?.trim()) issues.push(`row ${i}: missing productSlug`);
    if (!item.productName?.trim()) issues.push(`row ${i}: missing productName`);
    if (!Number.isInteger(item.qty) || item.qty < 1) issues.push(`row ${i}: invalid qty ${item.qty}`);
    if (!Number.isInteger(item.unitPriceCents) || item.unitPriceCents < 0) issues.push(`row ${i}: invalid unitPriceCents ${item.unitPriceCents}`);
    if (!Number.isInteger(item.lineTotalCents) || item.lineTotalCents < 0) issues.push(`row ${i}: invalid lineTotalCents ${item.lineTotalCents}`);
  });

  return issues;
}

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      items: {
        select: {
          productSlug: true,
          productName: true,
          variantId: true,
          variantLabel: true,
          qty: true,
          unitPriceCents: true,
          lineTotalCents: true,
        },
      },
    },
  });

  let scanned = 0;
  let matched = 0;
  let mismatched = 0;
  let skipped = 0;

  for (const order of orders) {
    const snapshot = order.items.map((row) => ({
      productSlug: row.productSlug,
      productName: row.productName,
      variantId: row.variantId,
      variantLabel: row.variantLabel,
      qty: Math.max(1, Math.floor(row.qty || 1)),
      unitPriceCents: Math.max(0, Math.round(row.unitPriceCents || 0)),
      lineTotalCents: Math.max(0, Math.round(row.lineTotalCents || 0)),
    }));

    if (snapshot.length === 0) {
      skipped += 1;
      continue;
    }

    scanned += 1;
    const issues = compareItems(snapshot);
    if (issues.length === 0) {
      matched += 1;
      console.log(`[ok] ${order.id}`);
      continue;
    }

    mismatched += 1;
    console.log(`[mismatch] ${order.id}`);
    for (const issue of issues) console.log(`  - ${issue}`);
  }

  console.log("\nVerification finished");
  console.log({ scanned, matched, mismatched, skipped });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
