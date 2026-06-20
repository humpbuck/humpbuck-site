import { loadEnvConfig } from "@next/env";
import { prisma } from "@/lib/prisma";

loadEnvConfig(process.cwd());

async function main() {
  const rows = await prisma.catalogProduct.findMany({ orderBy: { slug: "asc" } });
  const out: Record<string, unknown> = {};
  for (const r of rows) {
    out[r.slug] = {
      name: r.name,
      categoryLabel: r.categoryLabel,
      shortDescription: r.shortDescription,
      description: r.description,
      highlights: JSON.parse(r.highlightsJson || "[]"),
      specs: JSON.parse(r.specsJson || "[]"),
    };
  }
  console.log(JSON.stringify(out, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
