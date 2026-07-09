import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

type SlugMigrateDb = Pick<
  PrismaClient,
  "productInventory" | "productReview" | "visitorEvent" | "videoTutorial"
>;

/**
 * When a catalog product slug changes, keep inventory / reviews / analytics / tutorials in sync.
 * Order line snapshots keep the historical slug.
 */
export async function migrateCatalogProductSlug(
  db: SlugMigrateDb,
  oldSlug: string,
  newSlug: string,
): Promise<void> {
  if (oldSlug === newSlug) return;

  // Remove orphan inventory rows already keyed by the target slug (no catalog row owns them yet).
  await db.productInventory.deleteMany({ where: { productSlug: newSlug } });

  await db.productInventory.updateMany({
    where: { productSlug: oldSlug },
    data: { productSlug: newSlug },
  });

  await db.productReview.updateMany({
    where: { productSlug: oldSlug },
    data: { productSlug: newSlug },
  });

  await db.visitorEvent.updateMany({
    where: { productSlug: oldSlug },
    data: { productSlug: newSlug },
  });

  const tutorial = await db.videoTutorial.findUnique({ where: { productSlug: oldSlug } });
  if (tutorial) {
    await db.videoTutorial.delete({ where: { productSlug: oldSlug } }).catch(() => null);
    await db.videoTutorial.upsert({
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

/** Slug migration via app Prisma client (D1-safe — no interactive transaction). */
export async function migrateCatalogProductSlugOnDb(
  oldSlug: string,
  newSlug: string,
): Promise<void> {
  return migrateCatalogProductSlug(prisma, oldSlug, newSlug);
}
