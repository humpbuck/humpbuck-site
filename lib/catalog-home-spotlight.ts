import "server-only";

import { prisma } from "@/lib/prisma";
import { ensureCatalogProductSchema } from "@/lib/catalog-product-schema";
import { revalidateCatalogStorefront } from "@/lib/revalidate-catalog";

/** Only one product can be the homepage hero spotlight at a time. */
export async function setHomeSpotlightProduct(productId: string | null): Promise<void> {
  await ensureCatalogProductSchema();
  await prisma.catalogProduct.updateMany({
    where: { homeSpotlight: true },
    data: { homeSpotlight: false },
  });
  if (productId) {
    await prisma.catalogProduct.update({
      where: { id: productId },
      data: { homeSpotlight: true },
    });
  }
  revalidateCatalogStorefront();
}
