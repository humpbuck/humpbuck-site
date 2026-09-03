import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminHomeProductArrange } from "@/components/admin/admin-home-product-arrange";
import { adminPath } from "@/lib/admin-path";
import { ensureCatalogProductSchema } from "@/lib/catalog-product-schema";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function firstGalleryImage(galleryJson: string, fallback: string): string {
  try {
    const parsed = JSON.parse(galleryJson) as unknown;
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (typeof item === "string" && item.trim()) return item.trim();
      }
    }
  } catch {
    /* ignore */
  }
  return fallback.trim();
}

export default async function AdminHomeProductArrangePage() {
  await ensureCatalogProductSchema();
  const products = await prisma.catalogProduct.findMany({
    where: { status: { not: "archived" } },
    orderBy: [{ slug: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      image: true,
      galleryJson: true,
      homeRecommended: true,
      homeRecommendedSort: true,
      homeFeatured: true,
      homeFeaturedSort: true,
    },
  });

  const arrangeProducts = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    image: firstGalleryImage(p.galleryJson, p.image),
  }));

  const initialRecommendedIds = [...products]
    .filter((p) => p.homeRecommended)
    .sort(
      (a, b) =>
        a.homeRecommendedSort - b.homeRecommendedSort ||
        a.slug.localeCompare(b.slug),
    )
    .map((p) => p.id);

  const initialFeaturedIds = [...products]
    .filter((p) => p.homeFeatured)
    .sort(
      (a, b) =>
        a.homeFeaturedSort - b.homeFeaturedSort || a.slug.localeCompare(b.slug),
    )
    .map((p) => p.id);

  return (
    <div>
      <AdminBackLink href={adminPath("/inventory")} label="Products" />
      <h1 className="mt-4 font-serif text-3xl tracking-tight">
        Home product arrange
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Drag to set the order for homepage Recommended watches and Featured.
        The live homepage follows this order after each save.
      </p>

      <div className="mt-8">
        <AdminHomeProductArrange
          products={arrangeProducts}
          initialRecommendedIds={initialRecommendedIds}
          initialFeaturedIds={initialFeaturedIds}
        />
      </div>
    </div>
  );
}
