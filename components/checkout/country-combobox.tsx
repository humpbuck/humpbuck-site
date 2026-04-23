"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHECKOUT_COUNTRIES } from "@/lib/checkout-regions";

export function CountryCombobox({
  id,
  label,
  required,
  value,
  onChange,
  className = "",
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (countryValue: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  /** True right after opening with a selection: show full country list while input still shows the label. */
  const [browseFromSelection, setBrowseFromSelection] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const openRef = useRef(false);

  const selectedLabel = useMemo(() => {
    if (!value.trim()) return "";
    const hit = CHECKOUT_COUNTRIES.find((c) => c.value === value);
    if (hit) return hit.label;
    if (value.trim() === "United States") {
      return (
        CHECKOUT_COUNTRIES.find((c) => c.value === "United States of America")
          ?.label ?? "United States (US)"
      );
    }
    return value.trim();
  }, [value]);

  useEffect(() => {
    if (open) return;
    setText(selectedLabel);
  }, [selectedLabel, open]);

  openRef.current = open;

  useEffect(() => {
    if (!open) setBrowseFromSelection(false);
  }, [open]);

  const filtered = useMemo(() => {
    const qRaw = text.trim().toLowerCase();
    const q =
      open && browseFromSelection && value.trim() ? "" : qRaw;
    if (!q) return CHECKOUT_COUNTRIES;
    const hits = CHECKOUT_COUNTRIES.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.value.toLowerCase().includes(q),
    );
    const starts = hits.filter(
      (c) =>
        c.label.toLowerCase().startsWith(q) ||
        c.value.toLowerCase().startsWith(q),
    );
    const contains = hits.filter(
      (c) =>
        !c.label.toLowerCase().startsWith(q) &&
        !c.value.toLowerCase().startsWith(q),
    );
    return [...starts, ...contains];
  }, [text, open, browseFromSelection, value]);

  useEffect(() => {
    function handlePointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        if (openRef.current) {
          setText(selectedLabel);
        }
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [selectedLabel]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setText(selectedLabel);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, selectedLabel]);

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

  const openListFromInput = useCallback(() => {
    setOpen(true);
    if (!value.trim()) {
      setText("");
      setBrowseFromSelection(false);
    } else {
      setText(selectedLabel);
      setBrowseFromSelection(true);
    }
  }, [value, selectedLabel]);

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
      <div className="mt-1.5 flex min-h-11 w-full items-stretch gap-0 rounded-xl border border-line bg-paper ring-ink/20 focus-within:ring-2">
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
          spellCheck={false}
          placeholder="Select country / region"
          value={text}
          aria-expanded={open}
          aria-autocomplete="list"
          aria-required={required}
          aria-controls={`${id}-listbox`}
          className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted"
          onChange={(e) => {
            setBrowseFromSelection(false);
            const next = e.target.value;
            if (value && next.trim() !== selectedLabel.trim()) {
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
        {value ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Clear country"
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
              setText(selectedLabel);
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
              <li className="px-3 py-2 text-muted">No matches</li>
            ) : (
              filtered.map((c) => (
                <li key={c.value} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === c.value}
                    className={`w-full px-3 py-2 text-left hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none ${
                      value === c.value
                        ? "bg-zinc-100 font-medium text-ink"
                        : "text-ink"
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(c.value);
                      setOpen(false);
                    }}
                  >
                    {c.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
