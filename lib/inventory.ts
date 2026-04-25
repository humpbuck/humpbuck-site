import { prisma } from "@/lib/prisma";

/** Minimal line info needed for inventory operations. */
type InventoryLine = { slug: string; qty: number; variantId?: string };

/**
 * Check stock availability for a set of validated cart lines.
 * Returns `{ ok: true }` or `{ ok: false, unavailable }` with details.
 */
export async function checkInventory(
  lines: InventoryLine[],
): Promise<
  | { ok: true }
  | { ok: false; unavailable: { slug: string; variantId?: string; requested: number; available: number }[] }
> {
  const keys = lines.map((l) => ({
    productSlug: l.slug,
    variantId: l.variantId ?? "",
  }));

  const records = await prisma.productInventory.findMany({
    where: {
      OR: keys.map((k) => ({
        productSlug: k.productSlug,
        variantId: k.variantId,
      })),
    },
  });

  const lookup = new Map(
    records.map((r) => [`${r.productSlug}::${r.variantId}`, r.quantity]),
  );

  const unavailable: { slug: string; variantId?: string; requested: number; available: number }[] = [];

  for (const line of lines) {
    const key = `${line.slug}::${line.variantId ?? ""}`;
    const available = lookup.get(key);
    // If no inventory record exists, treat as unlimited (backwards compatible)
    if (available === undefined) continue;
    if (line.qty > available) {
      unavailable.push({
        slug: line.slug,
        variantId: line.variantId,
        requested: line.qty,
        available,
      });
    }
  }

  if (unavailable.length > 0) return { ok: false, unavailable };
  return { ok: true };
}

/**
 * Decrement inventory in a transaction. Throws if any item has insufficient stock.
 * Call this AFTER payment is confirmed (webhook / capture).
 */
export async function decrementInventory(
  lines: InventoryLine[],
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const line of lines) {
      const variantId = line.variantId ?? "";

      // Use raw SQL for atomic decrement with check
      const updated = await tx.$executeRaw`
        UPDATE "ProductInventory"
        SET "quantity" = "quantity" - ${line.qty},
            "updatedAt" = NOW()
        WHERE "productSlug" = ${line.slug}
          AND "variantId" = ${variantId}
          AND "quantity" >= ${line.qty}
      `;

      // If no row was updated, either no inventory record (unlimited) or insufficient stock
      if (updated === 0) {
        const record = await tx.productInventory.findUnique({
          where: { productSlug_variantId: { productSlug: line.slug, variantId } },
        });
        // If record exists but wasn't updated, stock is insufficient
        if (record) {
          throw new Error(
            `Insufficient stock for ${line.slug}${variantId ? ` (${variantId})` : ""}: requested ${line.qty}, available ${record.quantity}`,
          );
        }
        // No record = unlimited stock, skip
      }
    }
  });
}

/**
 * Restore inventory when an order is cancelled or refunded.
 */
export async function restoreInventory(
  lines: { slug: string; qty: number; variantId?: string }[],
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const line of lines) {
      const variantId = line.variantId ?? "";
      await tx.$executeRaw`
        UPDATE "ProductInventory"
        SET "quantity" = "quantity" + ${line.qty},
            "updatedAt" = NOW()
        WHERE "productSlug" = ${line.slug}
          AND "variantId" = ${variantId}
      `;
    }
  });
}

/**
 * Get inventory status for a product (all variants).
 */
export async function getProductInventory(productSlug: string) {
  return prisma.productInventory.findMany({
    where: { productSlug },
    orderBy: { variantId: "asc" },
  });
}

/**
 * Get inventory for a specific product+variant.
 */
export async function getVariantInventory(productSlug: string, variantId = "") {
  return prisma.productInventory.findUnique({
    where: { productSlug_variantId: { productSlug, variantId } },
  });
}

/**
 * Get all low-stock items.
 */
export async function getLowStockItems() {
  const all = await prisma.productInventory.findMany();
  return all.filter((r) => r.quantity <= r.lowStockThreshold);
}
