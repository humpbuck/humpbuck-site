import { AdminBackLink } from "@/components/admin/admin-back-link";
import { adminPath } from "@/lib/admin-path";
import { prisma } from "@/lib/prisma";
import { ProductManager } from "@/components/admin/product-manager";

const EMPTY_JSON = JSON.stringify([]);

export default async function AdminInventoryPage() {
  const [products, inventory] = await Promise.all([
    prisma.catalogProduct.findMany({ orderBy: [{ slug: "asc" }] }),
    prisma.productInventory.findMany({
      orderBy: [{ productSlug: "asc" }, { variantId: "asc" }],
    }),
  ]);
  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="font-serif text-3xl tracking-tight">Products & Inventory</h1>
      <p className="mt-2 text-sm text-muted">
        Create, update, and delete products. Manage inventory, media, and product copy in one place.
      </p>

      <div className="mt-8">
        <ProductManager
          initialProducts={products.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            seriesSlug: p.seriesSlug,
            categoryLabel: p.categoryLabel,
            shortDescription: p.shortDescription,
            description: p.description,
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            image: p.image,
            inStock: p.inStock,
            status: p.status,
            highlightsJson: p.highlightsJson ?? EMPTY_JSON,
            specsJson: p.specsJson ?? EMPTY_JSON,
            galleryJson: p.galleryJson ?? EMPTY_JSON,
            detailJson: p.detailJson ?? EMPTY_JSON,
            variantsJson: p.variantsJson ?? EMPTY_JSON,
            promoVideoJson: p.promoVideoJson,
            storefrontCategory: (p as { storefrontCategory?: string | null }).storefrontCategory ?? "",
            storefrontSubcategory:
              (p as { storefrontSubcategory?: string | null }).storefrontSubcategory ?? "",
            storefrontSeries: (p as { storefrontSeries?: string | null }).storefrontSeries ?? "",
          }))}
          initialInventory={inventory}
        />
      </div>
    </div>
  );
}
