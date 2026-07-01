import {
  emptyImageBlock,
  emptyProductBlock,
  emptyVideoBlock,
  normalizeProductHref,
  parseBlogBody,
  serializeImageBlock,
  serializeProductBlock,
  serializeVideoBlock,
  type BlogImageBlock,
  type BlogProductBlock,
  type BlogVideoAspectRatio,
  type BlogVideoBlock,
} from "@/lib/blog-article-blocks";
import { isDirectVideoUrl, youtubeEmbedUrl } from "@/lib/blog-video";

export type AdminProductOption = {
  slug: string;
  name: string;
  image: string;
};

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function hrefToSlug(href: string): string {
  const match = normalizeProductHref(href).match(/^\/product\/([a-z0-9-]+)$/i);
  return match?.[1] ?? "";
}

function productSelectOptions(products: AdminProductOption[], selectedSlug: string): string {
  const options = ['<option value="">No link — image only</option>'];
  for (const product of products) {
    const selected = product.slug === selectedSlug ? " selected" : "";
    options.push(
      `<option value="${escapeAttr(product.slug)}"${selected}>${escapeHtml(product.name)}</option>`,
    );
  }
  return options.join("");
}

function productSlugSelectOptions(products: AdminProductOption[], selectedSlug: string): string {
  const options = ['<option value="">Select product…</option>'];
  for (const product of products) {
    const selected = product.slug === selectedSlug ? " selected" : "";
    options.push(
      `<option value="${escapeAttr(product.slug)}"${selected}>${escapeHtml(product.name)}</option>`,
    );
  }
  return options.join("");
}

function videoAspectOptions(selected: BlogVideoAspectRatio): string {
  const options: { value: BlogVideoAspectRatio; label: string }[] = [
    { value: "auto", label: "Auto — natural size (R2) / 16:9 (YouTube)" },
    { value: "16:9", label: "Landscape 16:9" },
    { value: "9:16", label: "Portrait 9:16" },
  ];
  return options
    .map((option) => {
      const selectedAttr = option.value === selected ? " selected" : "";
      return `<option value="${option.value}"${selectedAttr}>${escapeHtml(option.label)}</option>`;
    })
    .join("");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const BLOCK_SHELL =
  "my-4 rounded-xl border bg-white p-3 sm:p-4 select-none [&_input]:select-text [&_select]:select-text";

export function buildVideoPreviewHtml(src: string, aspectRatio: BlogVideoAspectRatio): string {
  const trimmed = src.trim();
  if (!trimmed) {
    return `<div class="flex aspect-video items-center justify-center px-3 text-center text-xs text-muted">Preview when URL is set</div>`;
  }
  const yt = youtubeEmbedUrl(trimmed);
  if (yt) {
    const aspectClass =
      aspectRatio === "9:16"
        ? "aspect-[9/16] max-w-[280px]"
        : aspectRatio === "16:9"
          ? "aspect-video"
          : "aspect-video";
    return `<iframe src="${escapeAttr(yt)}" title="Video preview" class="h-full w-full border-0 ${aspectClass}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }
  if (isDirectVideoUrl(trimmed)) {
    if (aspectRatio === "auto") {
      return `<video src="${escapeAttr(trimmed)}" controls playsinline preload="metadata" class="max-h-48 w-full object-contain"></video>`;
    }
    const aspectClass = aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-video";
    return `<video src="${escapeAttr(trimmed)}" controls playsinline preload="metadata" class="h-full w-full object-cover ${aspectClass}"></video>`;
  }
  return `<div class="flex aspect-video items-center justify-center px-3 text-center text-xs text-muted">Unsupported URL — use R2 (.mp4) or YouTube</div>`;
}

export function buildImageBlockEditorHtml(
  block: BlogImageBlock,
  products: AdminProductOption[],
): string {
  const src = block.src.trim();
  const linkSlug = hrefToSlug(block.href);
  const preview = src
    ? `<img src="${escapeAttr(src)}" alt="" class="aspect-[4/3] h-full w-full object-cover" />`
    : `<div class="flex aspect-[4/3] items-center justify-center px-3 text-center text-xs text-muted">Preview when URL is set</div>`;

  return `<div data-blog-block="image" contenteditable="false" class="${BLOCK_SHELL} border-digital-dim/30 bg-digital-dim/[0.04]">
<div class="mb-2 flex items-center justify-between gap-2">
<span class="text-[10px] font-semibold uppercase tracking-[0.14em] text-digital-dim">Image</span>
<button type="button" data-blog-action="remove-block" class="rounded-lg border border-line bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-rose-700">Remove</button>
</div>
<div class="grid gap-3 sm:grid-cols-[120px_1fr]">
<div class="overflow-hidden rounded-xl bg-ink/[0.04] ring-1 ring-line" data-blog-image-preview>${preview}</div>
<div class="space-y-2">
<input data-field="src" type="text" value="${escapeAttr(block.src)}" placeholder="Image URL (R2 or HTTPS)" class="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm" />
<input data-field="alt" type="text" value="${escapeAttr(block.alt)}" placeholder="Alt text" class="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm" />
<label class="block text-xs text-muted"><span class="mb-1 block font-medium">Link to product (optional)</span>
<select data-field="href-slug" class="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink">${productSelectOptions(products, linkSlug)}</select></label>
</div></div></div>`;
}

export function buildProductBlockEditorHtml(
  block: BlogProductBlock,
  products: AdminProductOption[],
): string {
  const selected = products.find((p) => p.slug === block.slug);
  const preview = selected?.image?.trim()
    ? `<img src="${escapeAttr(selected.image.trim())}" alt="" class="aspect-square h-full w-full object-cover" />`
    : `<div class="flex aspect-square items-center justify-center px-3 text-center text-xs text-muted">Choose a product</div>`;

  return `<div data-blog-block="product" contenteditable="false" class="${BLOCK_SHELL} border-luxe-dim/30 bg-luxe-dim/[0.06]">
<div class="mb-2 flex items-center justify-between gap-2">
<span class="text-[10px] font-semibold uppercase tracking-[0.14em] text-luxe-dim">Product</span>
<button type="button" data-blog-action="remove-block" class="rounded-lg border border-line bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-rose-700">Remove</button>
</div>
<div class="grid gap-3 sm:grid-cols-[100px_1fr]">
<div class="overflow-hidden rounded-xl bg-ink/[0.04] ring-1 ring-line" data-blog-product-preview>${preview}</div>
<label class="block text-xs text-muted"><span class="mb-1 block font-medium">Product</span>
<select data-field="slug" class="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink">${productSlugSelectOptions(products, block.slug)}</select>
<p class="mt-2 text-sm text-muted" data-blog-product-name>${selected ? escapeHtml(selected.name) : "Pick a catalog product to embed."}</p></label>
</div></div>`;
}

export function buildVideoBlockEditorHtml(block: BlogVideoBlock): string {
  const preview = buildVideoPreviewHtml(block.src, block.aspectRatio);

  return `<div data-blog-block="video" contenteditable="false" class="${BLOCK_SHELL} border-teal-700/20 bg-teal-700/[0.04]">
<div class="mb-2 flex items-center justify-between gap-2">
<span class="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-800">Video</span>
<button type="button" data-blog-action="remove-block" class="rounded-lg border border-line bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-rose-700">Remove</button>
</div>
<div class="grid gap-3 sm:grid-cols-[140px_1fr]">
<div class="overflow-hidden rounded-xl bg-ink/[0.04] ring-1 ring-line" data-blog-video-preview>${preview}</div>
<div class="space-y-2">
<input data-field="src" type="text" value="${escapeAttr(block.src)}" placeholder="Video URL (R2 .mp4 or YouTube)" class="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm" />
<label class="block text-xs text-muted"><span class="mb-1 block font-medium">Layout</span>
<select data-field="aspect" class="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink">${videoAspectOptions(block.aspectRatio)}</select></label>
<input data-field="title" type="text" value="${escapeAttr(block.title)}" placeholder="Title (optional, for accessibility)" class="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm" />
</div></div></div>`;
}

export function emptyImageBlockEditorHtml(products: AdminProductOption[]): string {
  return buildImageBlockEditorHtml(emptyImageBlock(), products);
}

export function emptyProductBlockEditorHtml(products: AdminProductOption[]): string {
  return buildProductBlockEditorHtml(emptyProductBlock(), products);
}

export function emptyVideoBlockEditorHtml(): string {
  return buildVideoBlockEditorHtml(emptyVideoBlock());
}

export function readImageBlockFromElement(element: HTMLElement): BlogImageBlock {
  const src = element.querySelector<HTMLInputElement>('[data-field="src"]')?.value.trim() ?? "";
  const alt = element.querySelector<HTMLInputElement>('[data-field="alt"]')?.value.trim() ?? "";
  const slug =
    element.querySelector<HTMLSelectElement>('[data-field="href-slug"]')?.value.trim() ?? "";
  return {
    type: "image",
    src,
    alt,
    href: slug ? `/product/${slug}` : "",
  };
}

export function readProductBlockFromElement(element: HTMLElement): BlogProductBlock {
  const slug = element.querySelector<HTMLSelectElement>('[data-field="slug"]')?.value.trim() ?? "";
  return { type: "product", slug };
}

export function readVideoBlockFromElement(element: HTMLElement): BlogVideoBlock {
  const src = element.querySelector<HTMLInputElement>('[data-field="src"]')?.value.trim() ?? "";
  const aspectRaw =
    element.querySelector<HTMLSelectElement>('[data-field="aspect"]')?.value.trim() ?? "auto";
  const aspectRatio =
    aspectRaw === "16:9" || aspectRaw === "9:16" || aspectRaw === "auto" ? aspectRaw : "auto";
  const title = element.querySelector<HTMLInputElement>('[data-field="title"]')?.value.trim() ?? "";
  return { type: "video", src, aspectRatio, title };
}

export function serializeImageBlockFromElement(element: HTMLElement): string {
  const block = readImageBlockFromElement(element);
  if (!block.src.trim()) return "";
  return serializeImageBlock(block);
}

export function serializeProductBlockFromElement(element: HTMLElement): string {
  const block = readProductBlockFromElement(element);
  if (!block.slug.trim()) return "";
  return serializeProductBlock(block);
}

export function serializeVideoBlockFromElement(element: HTMLElement): string {
  const block = readVideoBlockFromElement(element);
  if (!block.src.trim()) return "";
  return serializeVideoBlock(block);
}

export function segmentNeedsProducts(body: string): boolean {
  return /\{\{(image|product)\s+/.test(body);
}

export { parseBlogBody };
