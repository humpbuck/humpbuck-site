import "server-only";

import { prisma } from "@/lib/prisma";

let catalogProductSchemaReady: Promise<void> | null = null;

/** SQLite/D1 has no `ADD COLUMN IF NOT EXISTS` — check `PRAGMA table_info` first. */
async function addCatalogProductColumnIfMissing(
  column: string,
  definition: string,
): Promise<void> {
  const columns = (await prisma.$queryRawUnsafe(
    `PRAGMA table_info("CatalogProduct")`,
  )) as { name: string }[];
  if (columns.some((c) => c.name === column)) return;
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "CatalogProduct" ADD COLUMN "${column}" ${definition}`,
  );
}

/** Ensures newer CatalogProduct columns exist on D1 before Prisma selects them. */
export async function ensureCatalogProductSchema(): Promise<void> {
  if (!catalogProductSchemaReady) {
    catalogProductSchemaReady = (async () => {
      await addCatalogProductColumnIfMissing(
        "homeSpotlight",
        "BOOLEAN NOT NULL DEFAULT false",
      );
    })();
  }
  await catalogProductSchemaReady;
}
