import type { Prisma } from "@prisma/client";

/** Canonical product slug: lowercase letters, digits, hyphens. */
export function normalizeProductSlug(s: string): string {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "product"
  );
}

export function isPrismaUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

type SlugMigrateTx = Prisma.TransactionClient;

/**
 * When a catalog product slug changes, keep inventory / reviews / analytics / tutorials in sync.
 * Order line snapshots keep the historical slug.
 */
export async function migrateCatalogProductSlug(
  tx: SlugMigrateTx,
  oldSlug: string,
  newSlug: string,
): Promise<void> {
  if (oldSlug === newSlug) return;

  // Remove orphan inventory rows already keyed by the target slug (no catalog row owns them yet).
  await tx.productInventory.deleteMany({ where: { productSlug: newSlug } });

  await tx.productInventory.updateMany({
    where: { productSlug: oldSlug },
    data: { productSlug: newSlug },
  });

  await tx.productReview.updateMany({
    where: { productSlug: oldSlug },
    data: { productSlug: newSlug },
  });

  await tx.visitorEvent.updateMany({
    where: { productSlug: oldSlug },
    data: { productSlug: newSlug },
  });

  const tutorial = await tx.videoTutorial.findUnique({ where: { productSlug: oldSlug } });
  if (tutorial) {
    await tx.videoTutorial.delete({ where: { productSlug: oldSlug } }).catch(() => null);
    await tx.videoTutorial.upsert({
      where: { productSlug: newSlug },
      create: {
        productSlug: newSlug,
        title: tutorial.title,
        url: tutorial.url,
        youtubeUrl: tutorial.youtubeUrl,
        aspectRatio: tutorial.aspectRatio,
        sortOrder: tutorial.sortOrder,
      },
      update: {
        title: tutorial.title,
        url: tutorial.url,
        youtubeUrl: tutorial.youtubeUrl,
        aspectRatio: tutorial.aspectRatio,
        sortOrder: tutorial.sortOrder,
      },
    });
  }
}
