import "server-only";

import { prisma } from "@/lib/prisma";
import {
  MAX_HOME_RECOMMENDED,
  MAX_HOME_RECOMMENDED_PER_CATEGORY,
} from "@/lib/catalog-home-recommended-limits";
import { ensureCatalogProductSchema } from "@/lib/catalog-product-schema";
import { resolveHomeRecommendedCategorySlug } from "@/lib/home-recommended-categories";
import { revalidateCatalogStorefront } from "@/lib/revalidate-catalog";

export { MAX_HOME_RECOMMENDED, MAX_HOME_RECOMMENDED_PER_CATEGORY };

/** Replace homepage category carousels with these product ids (display order). */
export async function setHomeRecommendedProducts(
  productIds: string[],
): Promise<void> {
  await ensureCatalogProductSchema();

  const uniqueIds = [...new Set(productIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length > MAX_HOME_RECOMMENDED) {
    throw new Error(
      `Select at most ${MAX_HOME_RECOMMENDED_PER_CATEGORY} products per category (${MAX_HOME_RECOMMENDED} total).`,
    );
  }

  if (uniqueIds.length > 0) {
    const found = await prisma.catalogProduct.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, categoryId: true, categoryLabel: true },
    });
    if (found.length !== uniqueIds.length) {
      throw new Error("One or more products were not found.");
    }

    const counts: Record<string, number> = {};
    for (const row of found) {
      const slug =
        resolveHomeRecommendedCategorySlug(row) ?? "unknown";
      counts[slug] = (counts[slug] ?? 0) + 1;
    }
    for (const [slug, count] of Object.entries(counts)) {
      if (count > MAX_HOME_RECOMMENDED_PER_CATEGORY) {
        throw new Error(
          `Select at most ${MAX_HOME_RECOMMENDED_PER_CATEGORY} products per category (${slug}: ${count}).`,
        );
      }
    }
  }

  await prisma.catalogProduct.updateMany({
    where: { homeRecommended: true },
    data: { homeRecommended: false, homeRecommendedSort: 0 },
  });

  for (let i = 0; i < uniqueIds.length; i += 1) {
    await prisma.catalogProduct.update({
      where: { id: uniqueIds[i] },
      data: { homeRecommended: true, homeRecommendedSort: i },
    });
  }

  revalidateCatalogStorefront();
}
