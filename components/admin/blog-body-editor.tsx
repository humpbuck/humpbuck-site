"use client";

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { Bold, Italic } from "lucide-react";
import {
  BLOG_BODY_COLOR_OPTIONS,
  BLOG_BODY_FONT_OPTIONS,
  BLOG_INLINE_COLOR_CLASS,
  BLOG_INLINE_FONT_CLASS,
  type BlogInlineColor,
  type BlogInlineFont,
} from "@/lib/blog-article-inline";
import { getMarkupFromEditorHtml, markupToEditorHtml } from "@/lib/blog-body-serializer";

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

export const BlogBodyEditor = forwardRef<
  BlogBodyEditorHandle,
  {
    value: string;
    onChange: (value: string) => void;
    minHeight?: number;
  }
>(function BlogBodyEditor({ value, onChange, minHeight = 240 }, ref) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef<string | null>(null);
  const internalChangeRef = useRef(false);

  useImperativeHandle(ref, () => ({
    flushMarkup: () => {
      const editor = editorRef.current;
      if (!editor) return value;
      const markup = getMarkupFromEditorHtml(editor.innerHTML, editor.innerText);
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
    if (value === lastValueRef.current && !editorIsEmpty) return;

    editor.innerHTML = markupToEditorHtml(value);
    lastValueRef.current = value;
  }, [value]);

  function syncMarkup() {
    const editor = editorRef.current;
    if (!editor) return;
    const markup = getMarkupFromEditorHtml(editor.innerHTML, editor.innerText);
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
    wrapSelectionWithSpan(
      editor,
      { "data-blog-font": font },
      BLOG_INLINE_FONT_CLASS[font],
    );
    syncMarkup();
  }

  function applyColor(color: BlogInlineColor) {
    const editor = editorRef.current;
    if (!editor) return;
    wrapSelectionWithSpan(
      editor,
      { "data-blog-color": color },
      BLOG_INLINE_COLOR_CLASS[color],
    );
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
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Article body"
        data-placeholder="Write the article here. Select text, then use Bold, Font, or Color."
        onInput={syncMarkup}
        onBlur={syncMarkup}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          syncMarkup();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
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
