import {
  BLOG_INLINE_COLOR_CLASS,
  BLOG_INLINE_FONT_CLASS,
  parseBlogInline,
  type BlogInlineColor,
  type BlogInlineFont,
  type BlogInlinePart,
} from "@/lib/blog-article-inline";
import { parseBlogBody } from "@/lib/blog-article-blocks";
import {
  buildImageBlockEditorHtml,
  buildProductBlockEditorHtml,
  buildVideoBlockEditorHtml,
  serializeImageBlockFromElement,
  serializeProductBlockFromElement,
  serializeVideoBlockFromElement,
  type AdminProductOption,
} from "@/lib/blog-body-editor-html";

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

export function markupToEditorHtml(markup: string, products: AdminProductOption[] = []): string {
  const trimmed = markup.trim();
  if (!trimmed) return "";

  const segments = parseBlogBody(trimmed);
  if (segments.length === 0) return "";

  return segments
    .map((segment) => {
      if (segment.type === "paragraph") {
        const text = segment.text.trim();
        if (!text) return "<p><br></p>";
        return `<p>${inlinePartsToEditorHtml(parseBlogInline(text))}</p>`;
      }
      if (segment.type === "image") {
        return buildImageBlockEditorHtml(segment, products);
      }
      if (segment.type === "video") {
        return buildVideoBlockEditorHtml(segment);
      }
      return buildProductBlockEditorHtml(segment, products);
    })
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

function collectEditorNodeMarkup(node: Node, parts: string[]) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? "").trim();
    if (text) parts.push(text);
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as HTMLElement;
  const blockKind = element.getAttribute("data-blog-block");
  if (blockKind === "image") {
    const token = serializeImageBlockFromElement(element);
    if (token) parts.push(token);
    return;
  }
  if (blockKind === "product") {
    const token = serializeProductBlockFromElement(element);
    if (token) parts.push(token);
    return;
  }
  if (blockKind === "video") {
    const token = serializeVideoBlockFromElement(element);
    if (token) parts.push(token);
    return;
  }

  const tag = element.tagName.toLowerCase();
  if (tag === "p") {
    if (element.querySelector("[data-blog-block]")) {
      for (const child of Array.from(element.childNodes)) {
        collectEditorNodeMarkup(child, parts);
      }
      return;
    }
    const text = blockElementToMarkup(element);
    if (text) parts.push(text);
    return;
  }

  if (tag === "div" || tag === "br") {
    for (const child of Array.from(element.childNodes)) {
      collectEditorNodeMarkup(child, parts);
    }
    return;
  }

  const text = blockElementToMarkup(element);
  if (text) parts.push(text);
}

/** Serialize live editor DOM — reads current input/select values (not innerHTML). */
export function editorElementToMarkup(editor: HTMLElement): string {
  const parts: string[] = [];
  for (const child of Array.from(editor.childNodes)) {
    collectEditorNodeMarkup(child, parts);
  }
  return parts.join("\n\n");
}

export function editorHtmlToMarkup(html: string): string {
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<br>" || trimmed === "<p><br></p>") return "";

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return "";

  const parts: string[] = [];
  for (const child of Array.from(root.childNodes)) {
    collectEditorNodeMarkup(child, parts);
  }

  return parts.join("\n\n");
}

/** Read markup from a contentEditable element, with plain-text fallback. */
export function getMarkupFromEditorElement(editor: HTMLElement): string {
  const markup = editorElementToMarkup(editor);
  if (markup.trim()) return markup;
  const text = editor.innerText.replace(/\u00a0/g, " ").trim();
  if (!text) return "";
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .join("\n\n");
}

/** @deprecated Prefer getMarkupFromEditorElement — innerHTML omits input values. */
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
