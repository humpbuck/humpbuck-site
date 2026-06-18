export type BlogInlineColor = "gold" | "muted" | "teal" | "ink";
export type BlogInlineFont = "serif" | "sans";

export type BlogInlinePart =
  | { type: "text"; value: string }
  | { type: "strong"; value: string; children: BlogInlinePart[] }
  | { type: "em"; value: string; children: BlogInlinePart[] }
  | { type: "color"; name: BlogInlineColor; children: BlogInlinePart[] }
  | { type: "font"; name: BlogInlineFont; children: BlogInlinePart[] };

const COLOR_TAG_RE = /\[(gold|muted|teal|ink)\]([\s\S]+?)\[\/\1\]/;
const FONT_TAG_RE = /\[(serif|sans)\]([\s\S]+?)\[\/\1\]/;
const STRONG_RE = /\*\*(.+?)\*\*/;
const EM_RE = /\*(.+?)\*/;

function parseInlineSegment(text: string): BlogInlinePart[] {
  const parts: BlogInlinePart[] = [];
  let rest = text;

  while (rest.length > 0) {
    const colorMatch = COLOR_TAG_RE.exec(rest);
    const fontMatch = FONT_TAG_RE.exec(rest);
    const strongMatch = STRONG_RE.exec(rest);
    const emMatch = EM_RE.exec(rest);

    const candidates = [
      colorMatch ? { kind: "color" as const, match: colorMatch, index: colorMatch.index } : null,
      fontMatch ? { kind: "font" as const, match: fontMatch, index: fontMatch.index } : null,
      strongMatch ? { kind: "strong" as const, match: strongMatch, index: strongMatch.index } : null,
      emMatch ? { kind: "em" as const, match: emMatch, index: emMatch.index } : null,
    ]
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.index - b.index);

    const next = candidates[0];
    if (!next) {
      parts.push({ type: "text", value: rest });
      break;
    }

    if (next.index > 0) {
      parts.push({ type: "text", value: rest.slice(0, next.index) });
    }

    if (next.kind === "color") {
      parts.push({
        type: "color",
        name: next.match[1] as BlogInlineColor,
        children: parseInlineSegment(next.match[2]),
      });
    } else if (next.kind === "font") {
      parts.push({
        type: "font",
        name: next.match[1] as BlogInlineFont,
        children: parseInlineSegment(next.match[2]),
      });
    } else if (next.kind === "strong") {
      parts.push({
        type: "strong",
        value: next.match[1],
        children: parseInlineSegment(next.match[1]),
      });
    } else {
      parts.push({
        type: "em",
        value: next.match[1],
        children: parseInlineSegment(next.match[1]),
      });
    }

    rest = rest.slice(next.index + next.match[0].length);
  }

  return parts.length > 0 ? parts : [{ type: "text", value: text }];
}

export function parseBlogInline(text: string): BlogInlinePart[] {
  return parseInlineSegment(text);
}

export const BLOG_INLINE_COLOR_CLASS: Record<BlogInlineColor, string> = {
  gold: "text-luxe-dim",
  muted: "text-muted",
  teal: "text-digital-dim",
  ink: "text-ink",
};

export const BLOG_INLINE_FONT_CLASS: Record<BlogInlineFont, string> = {
  serif: "font-serif",
  sans: "font-sans",
};

export const BLOG_BODY_COLOR_OPTIONS = [
  { id: "gold" as const, label: "Gold", swatch: "bg-luxe-dim" },
  { id: "muted" as const, label: "Gray", swatch: "bg-muted" },
  { id: "teal" as const, label: "Teal", swatch: "bg-digital-dim" },
  { id: "ink" as const, label: "Black", swatch: "bg-ink" },
] as const;

export const BLOG_BODY_FONT_OPTIONS = [
  { id: "sans" as const, label: "Body" },
  { id: "serif" as const, label: "Serif" },
] as const;
