import { loadEnvConfig } from "@next/env";
import { prisma } from "@/lib/prisma";
import { parseDetailBlocksJson } from "@/lib/product-detail-blocks";

loadEnvConfig(process.cwd());

async function main() {
  const rows = await prisma.catalogProduct.findMany({ orderBy: { slug: "asc" } });
  const out: Record<
    string,
    { name: string; detailBlocks: ReturnType<typeof parseDetailBlocksJson> }
  > = {};
  for (const r of rows) {
    const blocks = parseDetailBlocksJson(r.detailJson);
    const withText = blocks.filter((b) => b.title.trim() || b.body.trim());
    if (withText.length === 0 && !r.name.match(/^(Mechanical|Quartz|DIGI)/i)) continue;
    out[r.slug] = { name: r.name, detailBlocks: withText };
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
