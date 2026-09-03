import "server-only";

import { prisma } from "@/lib/prisma";
import { MAX_HOME_FEATURED } from "@/lib/catalog-home-recommended-limits";
import { ensureCatalogProductSchema } from "@/lib/catalog-product-schema";
import { revalidateCatalogStorefront } from "@/lib/revalidate-catalog";

export { MAX_HOME_FEATURED };

/** Replace the homepage Featured grid with these product ids (display order). */
export async function setHomeFeaturedProducts(
  productIds: string[],
): Promise<void> {
  await ensureCatalogProductSchema();

  const uniqueIds = [...new Set(productIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length > MAX_HOME_FEATURED) {
    throw new Error(`Select at most ${MAX_HOME_FEATURED} featured products.`);
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
    where: { homeFeatured: true },
    data: { homeFeatured: false, homeFeaturedSort: 0 },
  });

  for (let i = 0; i < uniqueIds.length; i += 1) {
    await prisma.catalogProduct.update({
      where: { id: uniqueIds[i] },
      data: { homeFeatured: true, homeFeaturedSort: i },
    });
  }

  revalidateCatalogStorefront();
}
