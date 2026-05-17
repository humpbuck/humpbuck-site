/**
 * Writes `prisma/seed-data/catalog-products.snapshot.json` from the current DB.
 * Re-run after intentional catalog changes so `npm run db:seed-catalog-products` can
 * repopulate an empty database (see `scripts/seed-catalog-products.ts`).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { CatalogProduct } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

type CatalogProductSnapshot = Omit<CatalogProduct, "id" | "createdAt" | "updatedAt">;

function toSnapshot(row: CatalogProduct): CatalogProductSnapshot {
  const { id, createdAt, updatedAt, ...rest } = row;
  void id;
  void createdAt;
  void updatedAt;
  return rest;
}

async function main() {
  const rows = await prisma.catalogProduct.findMany({ orderBy: { slug: "asc" } });
  if (rows.length === 0) {
    console.error("CatalogProduct is empty; nothing to export.");
    process.exitCode = 1;
    return;
  }
  const snapshot = rows.map(toSnapshot);
  const outDir = path.join(process.cwd(), "prisma", "seed-data");
  const outPath = path.join(outDir, "catalog-products.snapshot.json");
  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(`Wrote ${snapshot.length} row(s) to ${outPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
