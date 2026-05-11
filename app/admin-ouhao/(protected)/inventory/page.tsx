import { AdminBackLink } from "@/components/admin/admin-back-link";
import { adminPath } from "@/lib/admin-path";
import { prisma } from "@/lib/prisma";
import { ProductManager } from "@/components/admin/product-manager";
import { getAllProducts, type Product } from "@/lib/catalog";

const EMPTY_JSON = JSON.stringify([]);

function toCatalogProductRecord(p: Product) {
  return {
    id: p.slug,
    slug: p.slug,
    name: p.name,
    seriesSlug: p.seriesSlug,
    categoryLabel: p.categoryLabel,
    shortDescription: p.shortDescription,
    description: p.description,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    image: p.image,
    inStock: p.inStock,
    highlightsJson: EMPTY_JSON,
    specsJson: EMPTY_JSON,
    galleryJson: JSON.stringify(p.galleryImages ?? p.images ?? []),
    detailJson: JSON.stringify(p.detailImages ?? []),
    variantsJson: JSON.stringify(p.variantOptions ?? []),
    promoVideoJson: p.promoVideo ? JSON.stringify(p.promoVideo) : null,
  };
}

export default async function AdminInventoryPage() {
  let products = [] as ReturnType<typeof toCatalogProductRecord>[];
  try {
    products = (await prisma.catalogProduct.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    })) as unknown as ReturnType<typeof toCatalogProductRecord>[];
  } catch {
    products = getAllProducts().map(toCatalogProductRecord);
  }
  const inventory = await prisma.productInventory.findMany({
    orderBy: [{ productSlug: "asc" }, { variantId: "asc" }],
  });

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="font-serif text-3xl tracking-tight">Products & Inventory</h1>
      <p className="mt-2 text-sm text-muted">
        Create, update, and delete products. Manage inventory, media, and product copy in one place.
      </p>

      <div className="mt-8">
        <ProductManager
          initialProducts={products}
          initialInventory={inventory}
        />
      </div>
    </div>
  );
}
