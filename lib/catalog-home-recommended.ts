import "server-only";

import { prisma } from "@/lib/prisma";
import { MAX_HOME_RECOMMENDED } from "@/lib/catalog-home-recommended-limits";
import { ensureCatalogProductSchema } from "@/lib/catalog-product-schema";
import { revalidateCatalogStorefront } from "@/lib/revalidate-catalog";

export { MAX_HOME_RECOMMENDED };

/** Replace the homepage Recommended carousel with these product ids (display order). */
export async function setHomeRecommendedProducts(
  productIds: string[],
): Promise<void> {
  await ensureCatalogProductSchema();

  const uniqueIds = [...new Set(productIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length > MAX_HOME_RECOMMENDED) {
    throw new Error(`Select at most ${MAX_HOME_RECOMMENDED} recommended products.`);
  }

  if (uniqueIds.length > 0) {
    const found = await prisma.catalogProduct.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    if (found.length !== uniqueIds.length) {
      throw new Error("One or more products were not found.");
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
