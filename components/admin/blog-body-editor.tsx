"use client";

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { Bold, ImageIcon, Italic, Package, Video } from "lucide-react";
import {
  BLOG_BODY_COLOR_OPTIONS,
  BLOG_BODY_FONT_OPTIONS,
  BLOG_INLINE_COLOR_CLASS,
  BLOG_INLINE_FONT_CLASS,
  type BlogInlineColor,
  type BlogInlineFont,
} from "@/lib/blog-article-inline";
import {
  buildVideoPreviewHtml,
  emptyImageBlockEditorHtml,
  emptyProductBlockEditorHtml,
  emptyVideoBlockEditorHtml,
  readVideoBlockFromElement,
  segmentNeedsProducts,
  type AdminProductOption,
} from "@/lib/blog-body-editor-html";
import { getMarkupFromEditorElement, markupToEditorHtml } from "@/lib/blog-body-serializer";

export type BlogBodyEditorHandle = {
  flushMarkup: () => string;
};

function wrapSelectionWithSpan(
  editor: HTMLElement,
  attrs: Record<string, string>,
  className: string,
) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  editor.focus();

  if (range.collapsed) return;

  const span = document.createElement("span");
  span.className = className;
  for (const [key, value] of Object.entries(attrs)) {
    span.setAttribute(key, value);
  }

  try {
    range.surroundContents(span);
  } catch {
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
  }

  selection.removeAllRanges();
  const nextRange = document.createRange();
  nextRange.selectNodeContents(span);
  selection.collapse(nextRange.endContainer, nextRange.endOffset);
}

function insertBlockHtmlAtSelection(editor: HTMLElement, html: string) {
  editor.focus();
  const selection = window.getSelection();
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  const block = template.content.firstElementChild;
  if (!block) return;

  if (!selection || selection.rangeCount === 0 || !editor.contains(selection.anchorNode)) {
    editor.appendChild(block);
    return;
  }

  let node: Node | null = selection.anchorNode;
  if (node?.nodeType === Node.TEXT_NODE) node = node.parentNode;

  let paragraph: HTMLElement | null = null;
  while (node && node !== editor) {
    if (node instanceof HTMLElement && node.tagName === "P") {
      paragraph = node;
      break;
    }
    node = node.parentNode;
  }

  if (paragraph?.parentNode) {
    paragraph.parentNode.insertBefore(block, paragraph.nextSibling);
  } else {
    const range = selection.getRangeAt(0);
    range.collapse(false);
    range.insertNode(block);
  }
}

function updateImageBlockPreview(block: HTMLElement) {
  const src = block.querySelector<HTMLInputElement>('[data-field="src"]')?.value.trim() ?? "";
  const preview = block.querySelector("[data-blog-image-preview]");
  if (!preview) return;
  preview.innerHTML = src
    ? `<img src="${src.replace(/"/g, "&quot;")}" alt="" class="aspect-[4/3] h-full w-full object-cover" />`
    : `<div class="flex aspect-[4/3] items-center justify-center px-3 text-center text-xs text-muted">Preview when URL is set</div>`;
}

function updateProductBlockPreview(block: HTMLElement, products: AdminProductOption[]) {
  const slug = block.querySelector<HTMLSelectElement>('[data-field="slug"]')?.value.trim() ?? "";
  const selected = products.find((p) => p.slug === slug);
  const preview = block.querySelector("[data-blog-product-preview]");
  const nameEl = block.querySelector("[data-blog-product-name]");
  if (preview) {
    preview.innerHTML =
      selected?.image?.trim()
        ? `<img src="${selected.image.trim().replace(/"/g, "&quot;")}" alt="" class="aspect-square h-full w-full object-cover" />`
        : `<div class="flex aspect-square items-center justify-center px-3 text-center text-xs text-muted">Choose a product</div>`;
  }
  if (nameEl) {
    nameEl.textContent = selected
      ? selected.name
      : "Pick a catalog product to embed.";
  }
}

function updateVideoBlockPreview(block: HTMLElement) {
  const videoBlock = readVideoBlockFromElement(block);
  const preview = block.querySelector("[data-blog-video-preview]");
  if (!preview) return;
  preview.innerHTML = buildVideoPreviewHtml(videoBlock.src, videoBlock.aspectRatio);
}

export const BlogBodyEditor = forwardRef<
  BlogBodyEditorHandle,
  {
    value: string;
    onChange: (value: string) => void;
    minHeight?: number;
  }
>(function BlogBodyEditor({ value, onChange, minHeight = 240 }, ref) {
  const editorRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<AdminProductOption[]>([]);
  const lastValueRef = useRef<string | null>(null);
  const internalChangeRef = useRef(false);

  useEffect(() => {
    void fetch("/api/admin/products", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data: { products?: { slug: string; name: string; image?: string }[] }) => {
        if (!Array.isArray(data.products)) return;
        productsRef.current = data.products.map((p) => ({
          slug: p.slug,
          name: p.name,
          image: p.image?.trim() ?? "",
        }));

        const editor = editorRef.current;
        if (!editor) return;
        if (internalChangeRef.current) return;
        const currentValue = lastValueRef.current ?? value;
        if (segmentNeedsProducts(currentValue)) {
          editor.innerHTML = markupToEditorHtml(currentValue, productsRef.current);
        }
      })
      .catch(() => undefined);
  }, [value]);

  useImperativeHandle(ref, () => ({
    flushMarkup: () => {
      const editor = editorRef.current;
      if (!editor) return value;
      const markup = getMarkupFromEditorElement(editor);
      internalChangeRef.current = true;
      lastValueRef.current = markup;
      onChange(markup);
      return markup;
    },
  }));

  useLayoutEffect(() => {
    if (internalChangeRef.current) {
      internalChangeRef.current = false;
      return;
    }
    const editor = editorRef.current;
    if (!editor) return;

    const editorIsEmpty = !editor.innerText.replace(/\u00a0/g, " ").trim();
    const hasBlocks = editor.querySelector("[data-blog-block]");
    if (value === lastValueRef.current && !editorIsEmpty && (!segmentNeedsProducts(value) || hasBlocks)) {
      return;
    }

    editor.innerHTML = markupToEditorHtml(value, productsRef.current);
    lastValueRef.current = value;
  }, [value]);

  function syncMarkup() {
    const editor = editorRef.current;
    if (!editor) return;
    const markup = getMarkupFromEditorElement(editor);
    internalChangeRef.current = true;
    lastValueRef.current = markup;
    onChange(markup);
  }

  function runCommand(command: "bold" | "italic") {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command);
    syncMarkup();
  }

  function applyFont(font: BlogInlineFont) {
    const editor = editorRef.current;
    if (!editor) return;
    wrapSelectionWithSpan(editor, { "data-blog-font": font }, BLOG_INLINE_FONT_CLASS[font]);
    syncMarkup();
  }

  function applyColor(color: BlogInlineColor) {
    const editor = editorRef.current;
    if (!editor) return;
    wrapSelectionWithSpan(editor, { "data-blog-color": color }, BLOG_INLINE_COLOR_CLASS[color]);
    syncMarkup();
  }

  function insertImageBlock() {
    const editor = editorRef.current;
    if (!editor) return;
    insertBlockHtmlAtSelection(editor, emptyImageBlockEditorHtml(productsRef.current));
  }

  function insertProductBlock() {
    const editor = editorRef.current;
    if (!editor) return;
    insertBlockHtmlAtSelection(editor, emptyProductBlockEditorHtml(productsRef.current));
  }

  function insertVideoBlock() {
    const editor = editorRef.current;
    if (!editor) return;
    insertBlockHtmlAtSelection(editor, emptyVideoBlockEditorHtml());
  }

  function handleEditorInput(event: React.FormEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const block = target.closest<HTMLElement>("[data-blog-block]");
    if (block) {
      const kind = block.getAttribute("data-blog-block");
      if (kind === "image") {
        updateImageBlockPreview(block);
      } else if (kind === "video") {
        updateVideoBlockPreview(block);
      } else {
        updateProductBlockPreview(block, productsRef.current);
      }
    }
    syncMarkup();
  }

  function handleEditorClick(event: React.MouseEvent<HTMLDivElement>) {
    const removeBtn = (event.target as HTMLElement).closest("[data-blog-action='remove-block']");
    if (!removeBtn) return;
    event.preventDefault();
    removeBtn.closest("[data-blog-block]")?.remove();
    syncMarkup();
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper/70 px-3 py-2">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Format
        </span>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runCommand("bold")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink/80 hover:bg-white hover:text-ink"
          title="Bold"
          aria-label="Bold"
        >
          <Bold size={15} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runCommand("italic")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink/80 hover:bg-white hover:text-ink"
          title="Italic"
          aria-label="Italic"
        >
          <Italic size={15} strokeWidth={2.25} />
        </button>

        <span className="mx-1 hidden h-5 w-px bg-line sm:inline-block" aria-hidden />

        <label className="flex items-center gap-1.5 text-xs text-muted">
          <span className="font-medium">Font</span>
          <select
            defaultValue=""
            onChange={(e) => {
              const font = e.target.value as BlogInlineFont | "";
              if (!font) return;
              applyFont(font);
              e.target.value = "";
            }}
            className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-ink"
            aria-label="Apply font to selection"
          >
            <option value="">Choose…</option>
            {BLOG_BODY_FONT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-xs text-muted">
          <span className="font-medium">Color</span>
          <select
            defaultValue=""
            onChange={(e) => {
              const color = e.target.value as BlogInlineColor | "";
              if (!color) return;
              applyColor(color);
              e.target.value = "";
            }}
            className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-ink"
            aria-label="Apply color to selection"
          >
            <option value="">Choose…</option>
            {BLOG_BODY_COLOR_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1.5">
          {BLOG_BODY_COLOR_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyColor(option.id)}
              className={`h-5 w-5 rounded-full ring-1 ring-line ${option.swatch}`}
              title={option.label}
              aria-label={`Apply ${option.label} color`}
            />
          ))}
        </div>

        <span className="mx-1 hidden h-5 w-px bg-line sm:inline-block" aria-hidden />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertImageBlock}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/80 hover:bg-paper"
        >
          <ImageIcon size={14} />
          Insert image
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertProductBlock}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/80 hover:bg-paper"
        >
          <Package size={14} />
          Insert product
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertVideoBlock}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/80 hover:bg-paper"
        >
          <Video size={14} />
          Insert video
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Article body"
        data-placeholder="Write the article here. Place the cursor where you want an image, product, or video, then use the Insert buttons."
        onInput={handleEditorInput}
        onChange={handleEditorInput}
        onClick={handleEditorClick}
        onBlur={syncMarkup}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          syncMarkup();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            const insideBlock = (event.target as HTMLElement).closest("[data-blog-block]");
            if (insideBlock) return;
            event.preventDefault();
            document.execCommand("insertParagraph");
            syncMarkup();
          }
        }}
        className="blog-body-editor min-h-[240px] w-full px-3 py-3 text-sm leading-relaxed text-ink/85 outline-none sm:text-base empty:before:text-muted empty:before:content-[attr(data-placeholder)] [&_p]:mb-4 [&_p:last-child]:mb-0"
        style={{ minHeight }}
      />
    </div>
  );
});
