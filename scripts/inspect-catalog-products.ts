import { loadEnvConfig } from "@next/env";
import { prisma } from "@/lib/prisma";

loadEnvConfig(process.cwd());

async function main() {
  const rows = await prisma.catalogProduct.findMany({ orderBy: { slug: "asc" } });
  console.log(
    JSON.stringify(
      rows.map((r) => ({
        slug: r.slug,
        name: r.name,
        seriesSlug: r.seriesSlug,
        price: r.price,
        image: r.image,
        inStock: r.inStock,
        galleryLen: JSON.parse(r.galleryJson || "[]").length,
        detailLen: JSON.parse(r.detailJson || "[]").length,
        variantsLen: JSON.parse(r.variantsJson || "[]").length,
        hasVideo: !!r.promoVideoJson,
      })),
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
