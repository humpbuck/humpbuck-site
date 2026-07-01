export type BlogImageBlock = {
  type: "image";
  src: string;
  alt: string;
  href: string;
};

export type BlogProductBlock = {
  type: "product";
  slug: string;
};

export type BlogVideoAspectRatio = "16:9" | "9:16" | "auto";

export type BlogVideoBlock = {
  type: "video";
  src: string;
  aspectRatio: BlogVideoAspectRatio;
  title: string;
};

export type BlogParagraphSegment = {
  type: "paragraph";
  text: string;
};

export type BlogBodySegment =
  | BlogParagraphSegment
  | BlogImageBlock
  | BlogProductBlock
  | BlogVideoBlock;

const BLOCK_TOKEN_RE = /\{\{(image|product|video)\s+([^}]+)\}\}/g;

const ATTR_RE = /(\w+)="([^"]*)"/g;

function parseBlockAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of raw.matchAll(ATTR_RE)) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function parseVideoAspect(raw: string | undefined): BlogVideoAspectRatio {
  const value = raw?.trim();
  if (value === "16:9" || value === "9:16" || value === "auto") return value;
  return "auto";
}

function parseBlockToken(kind: string, attrRaw: string): BlogBodySegment | null {
  const attrs = parseBlockAttributes(attrRaw);
  if (kind === "image") {
    return {
      type: "image",
      src: attrs.src?.trim() ?? "",
      alt: attrs.alt?.trim() ?? "",
      href: normalizeProductHref(attrs.href?.trim() ?? ""),
    };
  }
  if (kind === "product") {
    return { type: "product", slug: attrs.slug?.trim() ?? "" };
  }
  if (kind === "video") {
    return {
      type: "video",
      src: attrs.src?.trim() ?? "",
      aspectRatio: parseVideoAspect(attrs.aspect),
      title: attrs.title?.trim() ?? "",
    };
  }
  return null;
}

/** Only allow internal product links in blog embeds. */
export function normalizeProductHref(href: string): string {
  const trimmed = href.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^\/product\/([a-z0-9-]+)\/?$/i);
  if (!match) return "";
  return `/product/${match[1]}`;
}

export function serializeImageBlock(block: BlogImageBlock): string {
  const parts = [`src="${block.src.replace(/"/g, "")}"`, `alt="${block.alt.replace(/"/g, "")}"`];
  const href = normalizeProductHref(block.href);
  if (href) parts.push(`href="${href}"`);
  return `{{image ${parts.join(" ")}}}`;
}

export function serializeProductBlock(block: BlogProductBlock): string {
  return `{{product slug="${block.slug.replace(/"/g, "")}"}}`;
}

export function serializeVideoBlock(block: BlogVideoBlock): string {
  const parts = [
    `src="${block.src.replace(/"/g, "")}"`,
    `aspect="${block.aspectRatio}"`,
  ];
  if (block.title.trim()) {
    parts.push(`title="${block.title.replace(/"/g, "")}"`);
  }
  return `{{video ${parts.join(" ")}}}`;
}

export function serializeBlogBody(segments: BlogBodySegment[]): string {
  return segments
    .map((segment) => {
      if (segment.type === "paragraph") return segment.text.trim();
      if (segment.type === "image") {
        if (!segment.src.trim()) return "";
        return serializeImageBlock(segment);
      }
      if (segment.type === "video") {
        if (!segment.src.trim()) return "";
        return serializeVideoBlock(segment);
      }
      if (!segment.slug.trim()) return "";
      return serializeProductBlock(segment);
    })
    .filter((part) => part.length > 0)
    .join("\n\n");
}

export function parseBlogBody(body: string): BlogBodySegment[] {
  const trimmed = body.trim();
  if (!trimmed) return [];

  const segments: BlogBodySegment[] = [];
  let lastIndex = 0;

  for (const match of trimmed.matchAll(BLOCK_TOKEN_RE)) {
    const index = match.index ?? 0;
    const before = trimmed.slice(lastIndex, index);
    pushParagraphSegments(segments, before);
    const block = parseBlockToken(match[1], match[2]);
    if (block) segments.push(block);
    lastIndex = index + match[0].length;
  }

  pushParagraphSegments(segments, trimmed.slice(lastIndex));
  return segments;
}

function pushParagraphSegments(segments: BlogBodySegment[], raw: string) {
  const text = raw.trim();
  if (!text) return;
  for (const paragraph of text.split(/\n{2,}/)) {
    const trimmed = paragraph.trim();
    if (trimmed) segments.push({ type: "paragraph", text: trimmed });
  }
}

export function emptyImageBlock(): BlogImageBlock {
  return { type: "image", src: "", alt: "", href: "" };
}

export function emptyProductBlock(): BlogProductBlock {
  return { type: "product", slug: "" };
}

export function emptyVideoBlock(): BlogVideoBlock {
  return { type: "video", src: "", aspectRatio: "auto", title: "" };
}
