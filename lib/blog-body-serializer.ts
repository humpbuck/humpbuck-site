import {
  BLOG_INLINE_COLOR_CLASS,
  BLOG_INLINE_FONT_CLASS,
  parseBlogInline,
  type BlogInlineColor,
  type BlogInlineFont,
  type BlogInlinePart,
} from "@/lib/blog-article-inline";

const VALID_COLORS = new Set<BlogInlineColor>(["gold", "muted", "teal", "ink"]);
const VALID_FONTS = new Set<BlogInlineFont>(["serif", "sans"]);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlinePartsToEditorHtml(parts: BlogInlinePart[]): string {
  return parts
    .map((part) => {
      switch (part.type) {
        case "text":
          return escapeHtml(part.value);
        case "strong":
          return `<strong>${inlinePartsToEditorHtml(part.children)}</strong>`;
        case "em":
          return `<em>${inlinePartsToEditorHtml(part.children)}</em>`;
        case "color":
          return `<span data-blog-color="${part.name}" class="${BLOG_INLINE_COLOR_CLASS[part.name]}">${inlinePartsToEditorHtml(part.children)}</span>`;
        case "font":
          return `<span data-blog-font="${part.name}" class="${BLOG_INLINE_FONT_CLASS[part.name]}">${inlinePartsToEditorHtml(part.children)}</span>`;
        default:
          return "";
      }
    })
    .join("");
}

export function markupToEditorHtml(markup: string): string {
  const trimmed = markup.trim();
  if (!trimmed) return "";

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return "";

  return paragraphs
    .map((paragraph) => `<p>${inlinePartsToEditorHtml(parseBlogInline(paragraph))}</p>`)
    .join("");
}

function inlineNodesToMarkup(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").replace(/\u00a0/g, " ");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  const children = Array.from(element.childNodes).map(inlineNodesToMarkup).join("");

  if (tag === "br") return "\n";
  if (tag === "strong" || tag === "b") return `**${children}**`;
  if (tag === "em" || tag === "i") return `*${children}*`;
  if (tag === "span") {
    const color = element.getAttribute("data-blog-color");
    if (color && VALID_COLORS.has(color as BlogInlineColor)) {
      return `[${color}]${children}[/${color}]`;
    }
    const font = element.getAttribute("data-blog-font");
    if (font && VALID_FONTS.has(font as BlogInlineFont)) {
      return `[${font}]${children}[/${font}]`;
    }
  }

  return children;
}

function blockElementToMarkup(element: HTMLElement): string {
  return inlineNodesToMarkup(element).replace(/\n+$/, "").trim();
}

export function editorHtmlToMarkup(html: string): string {
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<br>" || trimmed === "<p><br></p>") return "";

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return "";

  const paragraphs: string[] = [];

  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = (child.textContent ?? "").trim();
      if (text) paragraphs.push(text);
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const element = child as HTMLElement;
    const tag = element.tagName.toLowerCase();
    if (tag === "p" || tag === "div") {
      const text = blockElementToMarkup(element);
      if (text) paragraphs.push(text);
    } else {
      const text = blockElementToMarkup(element);
      if (text) paragraphs.push(text);
    }
  }

  return paragraphs.join("\n\n");
}

/** Read markup from a contentEditable element, with plain-text fallback. */
export function getMarkupFromEditorHtml(html: string, plainText: string): string {
  const markup = editorHtmlToMarkup(html);
  if (markup.trim()) return markup;
  const text = plainText.replace(/\u00a0/g, " ").trim();
  if (!text) return "";
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .join("\n\n");
}
