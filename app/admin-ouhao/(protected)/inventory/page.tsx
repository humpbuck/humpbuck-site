import { AdminBackLink } from "@/components/admin/admin-back-link";
import { ProductManagerLoader } from "@/components/admin/product-manager-loader";
import { adminPath } from "@/lib/admin-path";
import { ensureCatalogProductSchema } from "@/lib/catalog-product-schema";
import { getAllProductCategories } from "@/lib/product-categories";
import { ensureProductCategorySchema } from "@/lib/product-category-schema";
import { prisma } from "@/lib/prisma";

const EMPTY_JSON = JSON.stringify([]);

export default async function AdminInventoryPage() {
  await ensureCatalogProductSchema();
  await ensureProductCategorySchema();
  const [products, inventory, categories] = await Promise.all([
    prisma.catalogProduct.findMany({ orderBy: [{ slug: "asc" }] }),
    prisma.productInventory.findMany({
      orderBy: [{ productSlug: "asc" }, { variantId: "asc" }],
    }),
    getAllProductCategories(),
  ]);
  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="font-serif text-3xl tracking-tight">Products</h1>
      <p className="mt-2 text-sm text-muted">
        Create, update, and delete products. Manage inventory, media, and product copy in
        one place. Assign categories from the Categories page.
      </p>

      <div className="mt-8">
        <ProductManagerLoader
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }))}
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
            oemOdmPrice: (p as { oemOdmPrice?: number | null }).oemOdmPrice ?? null,
            image: p.image,
            inStock: p.inStock,
            status: p.status,
            highlightsJson: p.highlightsJson ?? EMPTY_JSON,
            specsJson: p.specsJson ?? EMPTY_JSON,
            galleryJson: p.galleryJson ?? EMPTY_JSON,
            detailJson: p.detailJson ?? EMPTY_JSON,
            variantsJson: p.variantsJson ?? EMPTY_JSON,
            promoVideoJson: p.promoVideoJson,
            categoryId: (p as { categoryId?: string | null }).categoryId ?? null,
            storefrontCategory:
              (p as { storefrontCategory?: string | null }).storefrontCategory ?? "",
            storefrontSubcategory:
              (p as { storefrontSubcategory?: string | null }).storefrontSubcategory ?? "",
            storefrontSeries:
              (p as { storefrontSeries?: string | null }).storefrontSeries ?? "",
            homeSpotlight: (p as { homeSpotlight?: boolean }).homeSpotlight ?? false,
            homeRecommended: (p as { homeRecommended?: boolean }).homeRecommended ?? false,
            homeRecommendedSort:
              (p as { homeRecommendedSort?: number }).homeRecommendedSort ?? 0,
          }))}
          initialInventory={inventory}
        />
      </div>
    </div>
  );
}
