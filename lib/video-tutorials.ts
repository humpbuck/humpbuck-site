import { getAllProducts } from "@/lib/catalog";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { prisma } from "@/lib/prisma";

export type VideoAspectRatio = "16:9" | "1:1" | "9:16";

export type VideoTutorial = {
  productSlug: string;
  title: string;
  url: string;
  aspectRatio: VideoAspectRatio;
  sortOrder: number;
  updatedAt: string;
};

export type VideoTutorialProductOption = {
  slug: string;
  name: string;
};

const DEFAULT_ASPECT_RATIO: VideoAspectRatio = "9:16";

function normalizeProductSlug(v: string): string {
  return v.trim().toLowerCase();
}

async function ensureVideoTutorialTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VideoTutorial" (
      "productSlug" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "aspectRatio" TEXT NOT NULL DEFAULT '9:16',
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "VideoTutorial"
      ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 9999
    `);
  } catch {
    // Older engines may not support IF NOT EXISTS; ignore when already present.
  }
}

function coerceAspectRatio(v: unknown): VideoAspectRatio {
  return v === "16:9" || v === "1:1" || v === "9:16"
    ? v
    : DEFAULT_ASPECT_RATIO;
}

function defaultTitle(name: string): string {
  return `${name} video tutorial`;
}

export async function listVideoTutorials({
  includeFallback = true,
}: {
  includeFallback?: boolean;
} = {}): Promise<VideoTutorial[]> {
  await ensureVideoTutorialTable();
  const merged = await getMergedCatalogProducts();
  const bySlug = new Map(merged.map((p) => [p.slug, p]));
  for (const p of getAllProducts()) {
    if (!bySlug.has(p.slug)) bySlug.set(p.slug, p);
  }

  const rows = (await prisma.$queryRawUnsafe(`
    SELECT "productSlug", "title", "url", "aspectRatio", "sortOrder", "updatedAt"
    FROM "VideoTutorial"
    ORDER BY "updatedAt" DESC
  `)) as Array<{
    productSlug: string;
    title: string;
    url: string;
    aspectRatio: string;
    sortOrder: number | null;
    updatedAt: Date;
  }>;
  const rowBySlug = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const key = normalizeProductSlug(row.productSlug);
    if (!rowBySlug.has(key)) rowBySlug.set(key, row);
  }

  const out: VideoTutorial[] = [];
  let fallbackSort = 10000;
  for (const product of bySlug.values()) {
    const row = rowBySlug.get(normalizeProductSlug(product.slug));
    const fallbackUrl = includeFallback ? product.promoVideo?.src?.trim() || "" : "";
    const hasRow = Boolean(row);
    const rowUrl = (row?.url ?? "").trim();
    const effectiveUrl = hasRow ? rowUrl : fallbackUrl;
    if (!effectiveUrl) continue;
    out.push({
      productSlug: product.slug,
      title: row?.title || defaultTitle(product.name),
      url: effectiveUrl,
      aspectRatio: coerceAspectRatio(row?.aspectRatio),
      sortOrder: row?.sortOrder ?? fallbackSort++,
      updatedAt: (row?.updatedAt ?? new Date(0)).toISOString(),
    });
  }

  return out
    .filter((x) => x.url.length > 0)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.title.localeCompare(b.title);
    })
    .map((x, idx) => ({ ...x, sortOrder: idx + 1 }));
}

export async function listVideoTutorialProductOptions(): Promise<
  VideoTutorialProductOption[]
> {
  const merged = await getMergedCatalogProducts();
  const bySlug = new Map(merged.map((p) => [p.slug, p]));
  for (const p of getAllProducts()) {
    if (!bySlug.has(p.slug)) bySlug.set(p.slug, p);
  }
  return [...bySlug.values()]
    .map((p) => ({ slug: p.slug, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveVideoTutorial(input: {
  productSlug: string;
  title: string;
  url: string;
  aspectRatio: VideoAspectRatio;
  sortOrder?: number;
}) {
  await ensureVideoTutorialTable();
  const productSlug = normalizeProductSlug(input.productSlug);
  const existingRows = (await prisma.$queryRaw`
    SELECT "productSlug"
    FROM "VideoTutorial"
    WHERE LOWER("productSlug") = LOWER(${productSlug})
  `) as Array<{ productSlug: string }>;
  for (const row of existingRows) {
    await prisma.$executeRaw`
      DELETE FROM "VideoTutorial"
      WHERE "productSlug" = ${row.productSlug}
    `;
  }
  await prisma.$executeRaw`
    INSERT INTO "VideoTutorial" ("productSlug", "title", "url", "aspectRatio", "sortOrder", "updatedAt")
    VALUES (${productSlug}, ${input.title}, ${input.url}, ${input.aspectRatio}, ${Math.max(1, input.sortOrder ?? 9999)}, NOW())
    ON CONFLICT ("productSlug")
    DO UPDATE SET
      "title" = EXCLUDED."title",
      "url" = EXCLUDED."url",
      "aspectRatio" = EXCLUDED."aspectRatio",
      "sortOrder" = EXCLUDED."sortOrder",
      "updatedAt" = NOW()
  `;
}

export async function saveVideoTutorialOrder(
  orderedProductSlugs: string[],
): Promise<void> {
  await ensureVideoTutorialTable();
  for (let i = 0; i < orderedProductSlugs.length; i += 1) {
    const slug = normalizeProductSlug(orderedProductSlugs[i] ?? "");
    if (!slug) continue;
    await prisma.$executeRaw`
      UPDATE "VideoTutorial"
      SET "sortOrder" = ${i + 1}, "updatedAt" = NOW()
      WHERE LOWER("productSlug") = LOWER(${slug})
    `;
  }
}

export async function deleteVideoTutorial(productSlug: string) {
  await ensureVideoTutorialTable();
  const normalizedSlug = normalizeProductSlug(productSlug);
  const deletedTitle = `${normalizedSlug} video tutorial`;
  await prisma.$executeRaw`
    INSERT INTO "VideoTutorial" ("productSlug", "title", "url", "aspectRatio", "updatedAt")
    VALUES (${normalizedSlug}, ${deletedTitle}, ${""}, ${DEFAULT_ASPECT_RATIO}, NOW())
    ON CONFLICT ("productSlug")
    DO UPDATE SET
      "url" = ${""},
      "updatedAt" = NOW()
  `;
}
