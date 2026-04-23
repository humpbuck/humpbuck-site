"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SearchableSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

/**
 * Combobox for static option lists (state / province): one editable field + list (no nested search box).
 */
export function SearchableSelect({
  id,
  label,
  required,
  value,
  onChange,
  options,
  className = "",
  searchPlaceholder = "Type to filter…",
  emptyMessage = "No matches",
  largeListThreshold = 250,
  showClear = true,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (next: string) => void;
  options: SearchableSelectOption[];
  className?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  largeListThreshold?: number;
  showClear?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  /** When true, list shows the full option set (or normal typeahead rules with empty query) while input still shows the current label — so user can see context and scroll. Cleared on first edit or when closed. */
  const [browseFromSelection, setBrowseFromSelection] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const openRef = useRef(false);

  const resolvedDisplay = useMemo(() => {
    if (!value) return "";
    const hit = options.find((o) => o.value === value && !o.disabled);
    return (hit?.label ?? value) || "";
  }, [options, value]);

  useEffect(() => {
    if (open) return;
    setText(resolvedDisplay);
  }, [resolvedDisplay, open]);

  openRef.current = open;

  useEffect(() => {
    if (!open) setBrowseFromSelection(false);
  }, [open]);

  const filtered = useMemo(() => {
    const qRaw = text.trim().toLowerCase();
    const q = open && browseFromSelection && value.trim() ? "" : qRaw;
    const placeholders = options.filter((o) => o.value === "");
    const data = options.filter((o) => o.value !== "" && !o.disabled);

    if (!q && data.length > largeListThreshold) {
      return [
        ...placeholders.map((o) => ({ ...o })),
        {
          value: "__typeahead_hint__",
          label: `Type letters or numbers (${data.length} options)…`,
          disabled: true,
        },
      ];
    }

    if (!q) return options.filter((o) => !o.disabled || o.value === "");

    const hitData = data.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
    const hitDataStarts = hitData.filter(
      (o) =>
        o.label.toLowerCase().startsWith(q) ||
        o.value.toLowerCase().startsWith(q),
    );
    const hitDataContains = hitData.filter(
      (o) =>
        !o.label.toLowerCase().startsWith(q) &&
        !o.value.toLowerCase().startsWith(q),
    );
    const hitPlaceholders = placeholders.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
    const merged = [...hitPlaceholders, ...hitDataStarts, ...hitDataContains];
    return merged.length > 500 ? merged.slice(0, 500) : merged;
  }, [options, text, largeListThreshold, open, browseFromSelection, value]);

  useEffect(() => {
    function handlePointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        if (openRef.current) {
          setText(resolvedDisplay);
        }
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [resolvedDisplay]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setText(resolvedDisplay);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, resolvedDisplay]);

  useEffect(() => {
    if (!open || !value.trim()) return;
    const id = window.requestAnimationFrame(() => {
      const opt = listRef.current?.querySelector(
        '[role="option"][aria-selected="true"]',
      );
      opt?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(id);
  }, [open, value, filtered, browseFromSelection]);

  const canShowClear = showClear && Boolean(value.trim());

  /** Opening while already focused does not fire `onFocus` — handle `onClick` too. */
  const openListFromInput = useCallback(() => {
    setOpen(true);
    if (!value.trim()) {
      setText("");
      setBrowseFromSelection(false);
    } else {
      setText(resolvedDisplay);
      setBrowseFromSelection(true);
    }
  }, [value, resolvedDisplay]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
        {required ? (
          <span className="text-rose-600" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </span>
      <div
        className="mt-1.5 flex min-h-11 w-full items-stretch gap-0 rounded-xl border border-line bg-paper ring-ink/20 focus-within:ring-2"
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
          spellCheck={false}
          placeholder={searchPlaceholder}
          value={text}
          aria-expanded={open}
          aria-autocomplete="list"
          aria-required={required}
          aria-controls={`${id}-listbox`}
          className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted"
          onChange={(e) => {
            setBrowseFromSelection(false);
            const next = e.target.value;
            if (value && next.trim() !== resolvedDisplay.trim()) {
              onChange("");
            }
            if (next.trim() === "") {
              onChange("");
            }
            setText(next);
            if (!open) setOpen(true);
          }}
          onFocus={openListFromInput}
          onClick={() => {
            if (!open) openListFromInput();
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && !open) {
              e.preventDefault();
              openListFromInput();
            }
          }}
        />
        {canShowClear ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Clear"
            className="shrink-0 px-2 text-base leading-none text-muted hover:text-ink"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange("");
              setText("");
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        ) : null}
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? "Close list" : "Open list"}
          className="shrink-0 px-2.5 text-muted hover:text-ink"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (open) {
              setText(resolvedDisplay);
              setOpen(false);
            } else {
              openListFromInput();
              inputRef.current?.focus();
            }
          }}
        >
          ▾
        </button>
      </div>

      {open ? (
        <div
          className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-line bg-paper shadow-lg"
          role="presentation"
        >
          <ul
            ref={listRef}
            id={`${id}-listbox`}
            className="max-h-60 overflow-y-auto py-1 text-sm"
            role="listbox"
            aria-labelledby={id}
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-muted">{emptyMessage}</li>
            ) : (
              filtered.map((o, i) => (
                <li
                  key={
                    o.value === "__typeahead_hint__"
                      ? "__typeahead_hint__"
                      : o.value || `opt-${i}`
                  }
                  role="none"
                >
                  {o.disabled || o.value === "__typeahead_hint__" ? (
                    <div className="px-3 py-2 text-xs text-muted">{o.label}</div>
                  ) : (
                    <button
                      type="button"
                      role="option"
                      aria-selected={value === o.value}
                      className={`w-full px-3 py-2 text-left hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none ${
                        value === o.value
                          ? "bg-zinc-100 font-medium text-ink"
                          : "text-ink"
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                      }}
                    >
                      {o.label}
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
