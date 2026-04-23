"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type AsyncSearchableOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

/**
 * Combobox: one text field for search + optional free text (no nested input).
 * Supports normal editing, context menu, and an explicit Clear control.
 */
export function AsyncSearchableSelect({
  id,
  label,
  required,
  value,
  onChange,
  className = "",
  loadOptions,
  searchPlaceholder = "Type to search…",
  emptyMessage = "No matches",
  freeText = false,
  freeTextHint = "Press Enter to use what you typed",
  disabled = false,
  outsideBoundaryRef,
  showClear = true,
  autoComplete,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (next: string) => void;
  className?: string;
  loadOptions: (query: string) => Promise<{
    options: AsyncSearchableOption[];
    freeText?: boolean;
    hint?: string;
  }>;
  searchPlaceholder?: string;
  emptyMessage?: string;
  freeText?: boolean;
  freeTextHint?: string;
  disabled?: boolean;
  outsideBoundaryRef?: RefObject<HTMLElement | null>;
  /** Show × to clear (recommended for city/postal; country may omit). */
  showClear?: boolean;
  autoComplete?: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  /** Opened with an existing value: keep label in the input but load/filter as if query were empty (full list + scroll to current). */
  const [browseFromSelection, setBrowseFromSelection] = useState(false);
  const [asyncOptions, setAsyncOptions] = useState<AsyncSearchableOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [serverFreeText, setServerFreeText] = useState(false);
  const [serverListHint, setServerListHint] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = useRef(false);
  const latestRef = useRef({ text, canFreeText: false, onChange, value });

  useEffect(() => {
    if (open) return;
    setText(value);
  }, [value, open]);

  const canFreeText = freeText || serverFreeText;
  openRef.current = open;
  latestRef.current = { text, canFreeText, onChange, value };

  useEffect(() => {
    if (!open) setBrowseFromSelection(false);
  }, [open]);

  const loadQuery = useMemo(() => {
    if (!open) return "";
    if (browseFromSelection && value.trim()) return "";
    return text.trim();
  }, [open, browseFromSelection, value, text]);

  const rankedOptions = useMemo(() => {
    const q =
      open && browseFromSelection && value.trim()
        ? ""
        : text.trim().toLowerCase();
    if (!q) return asyncOptions;
    const starts = asyncOptions.filter((o) => {
      if (o.disabled) return false;
      return (
        o.label.toLowerCase().startsWith(q) ||
        o.value.toLowerCase().startsWith(q)
      );
    });
    const contains = asyncOptions.filter((o) => {
      if (o.disabled) return false;
      const labelL = o.label.toLowerCase();
      const valL = o.value.toLowerCase();
      return (
        (labelL.includes(q) || valL.includes(q)) &&
        !labelL.startsWith(q) &&
        !valL.startsWith(q)
      );
    });
    const disabledRows = asyncOptions.filter((o) => o.disabled);
    return [...starts, ...contains, ...disabledRows];
  }, [asyncOptions, text, open, browseFromSelection, value]);

  const runLoad = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const res = await loadOptions(q);
        setAsyncOptions(res.options ?? []);
        setServerFreeText(Boolean(res.freeText));
        setServerListHint((res.hint ?? "").trim());
      } catch {
        setAsyncOptions([]);
        setServerFreeText(true);
        setServerListHint("");
      } finally {
        setLoading(false);
      }
    },
    [loadOptions],
  );

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runLoad(loadQuery);
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, loadQuery, runLoad]);

  useEffect(() => {
    if (!open || !value.trim() || loading) return;
    const id = window.requestAnimationFrame(() => {
      const opt = listRef.current?.querySelector(
        '[role="option"][aria-selected="true"]',
      );
      opt?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(id);
  }, [open, value, rankedOptions, loading, browseFromSelection]);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (!openRef.current) return;
      const target = e.target as Node;
      const root = rootRef.current;
      if (!root) return;
      if (root.contains(target)) return;

      const boundary = outsideBoundaryRef?.current;
      if (boundary?.contains(target)) {
        const { text: t, canFreeText: ft, onChange: oc, value: v } =
          latestRef.current;
        if (ft) oc(t.trim());
        else if (t.trim() !== v.trim()) setText(v);
        setOpen(false);
        return;
      }

      const { text: t, canFreeText: ft, onChange: oc, value: v } =
        latestRef.current;
      if (ft) {
        oc(t.trim());
      } else if (t.trim() !== v.trim()) {
        setText(v);
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [outsideBoundaryRef]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setText(value);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, value]);

  function commitClose() {
    const { text: t, canFreeText: ft, onChange: oc, value: v } =
      latestRef.current;
    if (ft) {
      oc(t.trim());
    } else if (t.trim() !== v.trim()) {
      setText(v);
    }
    setOpen(false);
  }

  const canShowClear =
    showClear && !disabled && Boolean((open ? text : value).trim());

  const openListFromInput = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    if (!value.trim()) {
      setText("");
      setBrowseFromSelection(false);
    } else {
      setText(value);
      setBrowseFromSelection(true);
    }
  }, [disabled, value]);

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
        className={`mt-1.5 flex min-h-11 w-full items-stretch gap-0 rounded-xl border border-line bg-paper ring-ink/20 focus-within:ring-2 ${
          disabled ? "opacity-60" : ""
        }`}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="search"
          autoComplete={autoComplete ?? "off"}
          spellCheck={false}
          disabled={disabled}
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
            if (next.trim() === "") {
              onChange("");
            } else if (value.trim() && next.trim() !== value.trim()) {
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
            if (e.key === "Enter" && canFreeText && text.trim()) {
              e.preventDefault();
              onChange(text.trim());
              setOpen(false);
            }
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
            onMouseDown={(e) => {
              e.preventDefault();
            }}
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
          aria-label={open ? "Close suggestions" : "Open suggestions"}
          disabled={disabled}
          className="shrink-0 px-2.5 text-muted hover:text-ink disabled:opacity-50"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={() => {
            if (disabled) return;
            if (open) {
              commitClose();
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
          {loading ? (
            <p className="border-b border-line/60 px-3 py-2 text-xs text-muted">
              Loading…
            </p>
          ) : null}
          {canFreeText && text.trim() ? (
            <p className="border-b border-line/60 px-3 py-1.5 text-[11px] text-muted">
              {freeTextHint}
            </p>
          ) : null}
          <ul
            ref={listRef}
            id={`${id}-listbox`}
            className="max-h-60 overflow-y-auto py-1 text-sm"
            role="listbox"
            aria-labelledby={id}
          >
            {!loading && rankedOptions.length === 0 ? (
              <li className="px-3 py-2 text-muted">
                {canFreeText && text.trim()
                  ? "No list match — press Enter to use what you typed, or keep typing."
                  : serverListHint || emptyMessage}
              </li>
            ) : (
              rankedOptions.map((o, i) => (
                <li key={o.value || `r-${i}`} role="none">
                  {o.disabled ? (
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
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                      onClick={() => {
                        onChange(o.value);
                        setText(o.value);
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
