import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { getAllProducts } from "../lib/catalog";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
  const products = getAllProducts();
  let count = 0;
  for (const p of products) {
    await prisma.catalogProduct.upsert({
      where: { slug: p.slug },
      create: {
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
        highlightsJson: JSON.stringify(p.highlights ?? []),
        specsJson: JSON.stringify(p.specs ?? []),
        galleryJson: JSON.stringify(p.galleryImages ?? p.images ?? []),
        detailJson: JSON.stringify(p.detailImages ?? []),
        variantsJson: JSON.stringify(
          (p.variantOptions ?? []).map((v) => ({
            id: v.id,
            label: v.label,
            image: v.image,
            inStock: v.inStock !== false,
          })),
        ),
        promoVideoJson: p.promoVideo ? JSON.stringify(p.promoVideo) : null,
      },
      update: {},
    });
    count += 1;
  }

  console.log(`Seeded ${count} catalog products into CatalogProduct.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
