/**
 * Verify migrated order items by comparing `Order.itemsJson` against `OrderItemSnapshot`.
 *
 * Usage:
 *   npx tsx scripts/verify-order-item-migration.ts
 *
 * Behavior:
 * - Compares each order's legacy JSON items to snapshot rows.
 * - Reports count, slug, variant, qty, and price mismatches.
 * - Skips orders with no legacy JSON and no snapshot rows.
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

type LegacyOrderItem = {
  slug?: string;
  name?: string;
  productName?: string;
  qty?: number;
  unitPrice?: number;
  price?: number;
  unitAmountCents?: number;
  lineTotal?: number;
  lineTotalCents?: number;
  variantId?: string;
  variantLabel?: string;
  variantImage?: string;
  productImage?: string;
};

type SnapshotRow = {
  productSlug: string;
  productName: string;
  variantId: string | null;
  variantLabel: string | null;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

function toCents(value?: number | null): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 100));
}

function pickString(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function pickNumber(...values: Array<unknown>): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function parseLegacyItems(raw: string | null): LegacyOrderItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is LegacyOrderItem =>
        x !== null && typeof x === "object" && !Array.isArray(x),
    );
  } catch {
    return [];
  }
}

function normalizeLegacyItem(item: LegacyOrderItem) {
  const qty = Math.max(1, Math.floor(pickNumber(item.qty) ?? 1));
  const unitPrice = pickNumber(item.unitAmountCents) != null
    ? (pickNumber(item.unitAmountCents) ?? 0) / 100
    : pickNumber(item.unitPrice, item.price) ?? 0;
  const unitPriceCents =
    pickNumber(item.unitAmountCents) ?? toCents(unitPrice);
  const lineTotal =
    pickNumber(item.lineTotal) ??
    pickNumber(item.lineTotalCents) ??
    unitPrice * qty;
  const lineTotalCents =
    pickNumber(item.lineTotalCents) ?? toCents(lineTotal);

  return {
    productSlug: pickString(item.slug) ?? "unknown",
    productName: pickString(item.name, item.productName) ?? "Unknown product",
    variantId: pickString(item.variantId),
    variantLabel: pickString(item.variantLabel),
    qty,
    unitPriceCents,
    lineTotalCents,
  } satisfies SnapshotRow;
}

function compareItems(legacy: SnapshotRow[], snapshot: SnapshotRow[]) {
  const issues: string[] = [];
  if (legacy.length !== snapshot.length) {
    issues.push(`count mismatch legacy=${legacy.length} snapshot=${snapshot.length}`);
  }

  const max = Math.max(legacy.length, snapshot.length);
  for (let i = 0; i < max; i += 1) {
    const a = legacy[i];
    const b = snapshot[i];
    if (!a || !b) {
      issues.push(`row ${i}: missing ${!a ? "legacy" : "snapshot"} item`);
      continue;
    }
    if (a.productSlug !== b.productSlug) issues.push(`row ${i}: slug ${a.productSlug} != ${b.productSlug}`);
    if (a.productName !== b.productName) issues.push(`row ${i}: name ${a.productName} != ${b.productName}`);
    if ((a.variantId ?? "") !== (b.variantId ?? "")) issues.push(`row ${i}: variantId ${(a.variantId ?? "")} != ${(b.variantId ?? "")}`);
    if ((a.variantLabel ?? "") !== (b.variantLabel ?? "")) issues.push(`row ${i}: variantLabel ${(a.variantLabel ?? "")} != ${(b.variantLabel ?? "")}`);
    if (a.qty !== b.qty) issues.push(`row ${i}: qty ${a.qty} != ${b.qty}`);
    if (a.unitPriceCents !== b.unitPriceCents) issues.push(`row ${i}: unitPriceCents ${a.unitPriceCents} != ${b.unitPriceCents}`);
    if (a.lineTotalCents !== b.lineTotalCents) issues.push(`row ${i}: lineTotalCents ${a.lineTotalCents} != ${b.lineTotalCents}`);
  }

  return issues;
}

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      itemsJson: true,
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
    const legacy = parseLegacyItems(order.itemsJson).map(normalizeLegacyItem);
    const snapshot = order.items.map((row) => ({
      productSlug: row.productSlug,
      productName: row.productName,
      variantId: row.variantId,
      variantLabel: row.variantLabel,
      qty: Math.max(1, Math.floor(row.qty || 1)),
      unitPriceCents: Math.max(0, Math.round(row.unitPriceCents || 0)),
      lineTotalCents: Math.max(0, Math.round(row.lineTotalCents || 0)),
    }));

    if (legacy.length === 0 && snapshot.length === 0) {
      skipped += 1;
      continue;
    }

    scanned += 1;
    const issues = compareItems(legacy, snapshot);
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
