export type ProductDetailBlockLayout = "image-left" | "text-left";

export type ProductDetailBlock = {
  image: string;
  title: string;
  body: string;
  layout: ProductDetailBlockLayout;
  /** Legacy URL-only entries render as full-width stack until edited in admin. */
  stacked?: boolean;
};

export const PRODUCT_DETAIL_BLOCK_LAYOUTS: ProductDetailBlockLayout[] = [
  "image-left",
  "text-left",
];

export const PRODUCT_DETAIL_BLOCK_LAYOUT_LABELS: Record<ProductDetailBlockLayout, string> = {
  "image-left": "Left image · right text",
  "text-left": "Left text · right image",
};

export function emptyProductDetailBlock(): ProductDetailBlock {
  return {
    image: "",
    title: "",
    body: "",
    layout: "image-left",
  };
}

export function detailBlockHasContent(block: ProductDetailBlock): boolean {
  return Boolean(block.image.trim() || block.title.trim() || block.body.trim());
}

export function isProductDetailBlockLayout(value: unknown): value is ProductDetailBlockLayout {
  return value === "image-left" || value === "text-left";
}

export function normalizeProductDetailBlock(raw: unknown): ProductDetailBlock | null {
  if (typeof raw === "string") {
    const image = raw.trim();
    if (!image) return null;
    return {
      image,
      title: "",
      body: "",
      layout: "image-left",
      stacked: true,
    };
  }
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const image = typeof row.image === "string" ? row.image.trim() : "";
  const title = typeof row.title === "string" ? row.title : "";
  const body = typeof row.body === "string" ? row.body : "";
  if (!image && !title.trim() && !body.trim()) return null;
  const layout = isProductDetailBlockLayout(row.layout) ? row.layout : "image-left";
  return { image, title, body, layout };
}

export function parseDetailBlocksJson(raw: string | null | undefined): ProductDetailBlock[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeProductDetailBlock(item))
      .filter((block): block is ProductDetailBlock => block != null);
  } catch {
    return [];
  }
}

export function serializeDetailBlocksForDb(blocks: ProductDetailBlock[]): string {
  const payload = blocks
    .map((block) => ({
      image: block.image.trim(),
      title: block.title.trim(),
      body: block.body.trim(),
      layout: block.layout,
    }))
    .filter((block) => block.image || block.title || block.body);
  return JSON.stringify(payload);
}

/** Pair R2 `detail/` URLs with admin blocks missing an image (same index). */
export function mergeDetailBlocksWithR2Images(
  blocks: ProductDetailBlock[],
  r2ImageUrls: string[],
): ProductDetailBlock[] {
  if (blocks.length === 0) return [];
  const urls = r2ImageUrls.map((url) => url.trim()).filter(Boolean);
  if (urls.length === 0) return blocks;
  return blocks.map((block, index) => ({
    ...block,
    image: block.image.trim() || urls[index] || block.image,
  }));
}

export function detailBlocksToImageUrls(blocks: ProductDetailBlock[]): string[] {
  return blocks.map((block) => block.image.trim()).filter(Boolean);
}

export function parseDetailBlocksPayload(body: unknown): ProductDetailBlock[] {
  if (!Array.isArray(body)) return [];
  return body
    .map((item) => normalizeProductDetailBlock(item))
    .filter((block): block is ProductDetailBlock => block != null);
}

export function blockUsesStackedLayout(block: ProductDetailBlock): boolean {
  return block.stacked === true;
}

/** PDP closer-look: admin `detailJson` blocks win; optional R2 `detail/` fill-in by index. */
export async function resolveCloserLookBlocksForPdp(
  catalogBlocks: ProductDetailBlock[] | undefined,
  listR2Detail: () => Promise<string[]>,
): Promise<ProductDetailBlock[]> {
  const adminBlocks = (catalogBlocks ?? []).filter(detailBlockHasContent);
  if (adminBlocks.length === 0) {
    const detail = await listR2Detail();
    return detail.map((image) => ({
      image,
      title: "",
      body: "",
      layout: "image-left" as const,
      stacked: true,
    }));
  }
  if (adminBlocks.every((block) => block.image.trim())) {
    return adminBlocks;
  }
  const detail = await listR2Detail();
  return mergeDetailBlocksWithR2Images(adminBlocks, detail);
}
