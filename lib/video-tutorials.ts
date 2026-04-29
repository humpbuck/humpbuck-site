import { getAllProducts } from "@/lib/catalog";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { prisma } from "@/lib/prisma";

export type VideoAspectRatio = "16:9" | "1:1" | "9:16";

export type VideoTutorial = {
  productSlug: string;
  title: string;
  url: string;
  aspectRatio: VideoAspectRatio;
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
    SELECT "productSlug", "title", "url", "aspectRatio", "updatedAt"
    FROM "VideoTutorial"
  `)) as Array<{
    productSlug: string;
    title: string;
    url: string;
    aspectRatio: string;
    updatedAt: Date;
  }>;
  const rowBySlug = new Map(
    rows.map((r) => [normalizeProductSlug(r.productSlug), r]),
  );

  const out: VideoTutorial[] = [];
  for (const product of bySlug.values()) {
    const row = rowBySlug.get(normalizeProductSlug(product.slug));
    const fallbackUrl = includeFallback ? product.promoVideo?.src?.trim() || "" : "";
    if (!row && !fallbackUrl) continue;
    out.push({
      productSlug: product.slug,
      title: row?.title || defaultTitle(product.name),
      url: (row?.url || fallbackUrl).trim(),
      aspectRatio: coerceAspectRatio(row?.aspectRatio),
      updatedAt: (row?.updatedAt ?? new Date(0)).toISOString(),
    });
  }

  return out
    .filter((x) => x.url.length > 0)
    .sort((a, b) => a.title.localeCompare(b.title));
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
}) {
  await ensureVideoTutorialTable();
  const productSlug = normalizeProductSlug(input.productSlug);
  await prisma.$executeRaw`
    INSERT INTO "VideoTutorial" ("productSlug", "title", "url", "aspectRatio", "updatedAt")
    VALUES (${productSlug}, ${input.title}, ${input.url}, ${input.aspectRatio}, NOW())
    ON CONFLICT ("productSlug")
    DO UPDATE SET
      "title" = EXCLUDED."title",
      "url" = EXCLUDED."url",
      "aspectRatio" = EXCLUDED."aspectRatio",
      "updatedAt" = NOW()
  `;
}

export async function deleteVideoTutorial(productSlug: string) {
  await ensureVideoTutorialTable();
  const normalizedSlug = normalizeProductSlug(productSlug);
  await prisma.$executeRaw`
    DELETE FROM "VideoTutorial"
    WHERE "productSlug" = ${normalizedSlug}
  `;
}
