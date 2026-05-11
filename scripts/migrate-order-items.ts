/**
 * Migrate legacy `Order.itemsJson` rows into `OrderItemSnapshot`.
 *
 * Usage:
 *   npx tsx scripts/migrate-order-items.ts
 *
 * Behavior:
 * - Processes orders in createdAt order.
 * - Skips orders that already have snapshot rows.
 * - Fails soft on malformed JSON and continues.
 * - Wraps each order in a transaction so snapshots stay consistent.
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

type LegacyOrderItem = {
  slug?: string;
  name?: string;
  productName?: string;
  productImage?: string;
  image?: string;
  qty?: number;
  unitPrice?: number;
  price?: number;
  unitAmountCents?: number;
  lineTotal?: number;
  lineTotalCents?: number;
  variantId?: string;
  variantLabel?: string;
  variantImage?: string;
  productSnapshot?: unknown;
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
  const unitPrice = pickNumber(item.unitPrice, item.price) ?? 0;
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
    productImage: pickString(item.productImage, item.variantImage, item.image),
    variantId: pickString(item.variantId),
    variantLabel: pickString(item.variantLabel),
    variantImage: pickString(item.variantImage),
    qty,
    unitPriceCents,
    lineTotalCents,
    currency: "usd",
    productSnapshotJson: item.productSnapshot
      ? JSON.stringify(item.productSnapshot)
      : null,
  };
}

async function migrateOneOrder(order: { id: string; itemsJson: string | null }) {
  const existingCount = await prisma.orderItemSnapshot.count({
    where: { orderId: order.id },
  });
  if (existingCount > 0) {
    console.log(`[skip] ${order.id} already has ${existingCount} snapshot row(s)`);
    return { skipped: true, created: 0 };
  }

  const legacyItems = parseLegacyItems(order.itemsJson);
  if (legacyItems.length === 0) {
    console.log(`[skip] ${order.id} no legacy items`);
    return { skipped: true, created: 0 };
  }

  const snapshots = legacyItems.map(normalizeLegacyItem);

  await prisma.$transaction(async (tx) => {
    await tx.orderItemSnapshot.createMany({
      data: snapshots.map((item) => ({
        orderId: order.id,
        productSlug: item.productSlug,
        productName: item.productName,
        productImage: item.productImage,
        variantId: item.variantId,
        variantLabel: item.variantLabel,
        variantImage: item.variantImage,
        qty: item.qty,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
        currency: item.currency,
        productSnapshotJson: item.productSnapshotJson,
      })),
    });
  });

  console.log(`[ok] ${order.id} migrated ${snapshots.length} item(s)`);
  return { skipped: false, created: snapshots.length };
}

async function main() {
  const batchSize = 100;
  let cursor: string | undefined;

  let totalOrders = 0;
  let migratedOrders = 0;
  let skippedOrders = 0;
  let failedOrders = 0;
  let totalItems = 0;

  while (true) {
    const orders = await prisma.order.findMany({
      take: batchSize,
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : {}),
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        itemsJson: true,
      },
    });

    if (orders.length === 0) break;

    for (const order of orders) {
      totalOrders += 1;
      try {
        const result = await migrateOneOrder(order);
        if (result.skipped) {
          skippedOrders += 1;
        } else {
          migratedOrders += 1;
          totalItems += result.created;
        }
      } catch (error) {
        failedOrders += 1;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[fail] ${order.id}: ${message}`);
      }
    }

    cursor = orders[orders.length - 1]?.id;
    console.log(`[batch] done cursor=${cursor}`);
  }

  console.log("\nMigration finished");
  console.log({
    totalOrders,
    migratedOrders,
    skippedOrders,
    failedOrders,
    totalItems,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
