"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  countryNameForShippingRateKey,
  listShippingFeeCountryOptions,
  shippingRateMatchesQuery,
  type ShippingFeeCountryOption,
} from "@/lib/shipping-fee-country-options";

type Props = {
  name: string;
  defaultValue?: string;
  className?: string;
  /** ISO / rate keys already configured (hidden from add picker). */
  excludeCodes?: readonly string[];
  placeholder?: string;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

function labelForRateKey(options: ShippingFeeCountryOption[], rateKey: string): string {
  const key = rateKey.trim().toUpperCase();
  if (!key) return "";
  return options.find((option) => option.value === key)?.label ?? countryNameForShippingRateKey(key);
}

function findExactMatch(
  options: ShippingFeeCountryOption[],
  query: string,
): ShippingFeeCountryOption | null {
  if (!query) return null;
  const q = query.trim().toLowerCase();
  return (
    options.find(
      (item) =>
        item.value.toLowerCase() === q ||
        item.englishName.toLowerCase() === q ||
        item.zhLabel.toLowerCase() === q ||
        item.label.toLowerCase() === q,
    ) ?? null
  );
}

export function ShippingFeeCountrySelect({
  name,
  defaultValue,
  className,
  excludeCodes,
  placeholder = "输入中文、英文或代号",
}: Props) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const anchorRef = useRef<HTMLDivElement>(null);
  const allOptions = useMemo(() => listShippingFeeCountryOptions(), []);
  const excluded = useMemo(
    () => new Set((excludeCodes ?? []).map((code) => code.trim().toUpperCase())),
    [excludeCodes],
  );

  const initialKey = defaultValue?.trim().toUpperCase() ?? "";
  const initialLabel = labelForRateKey(allOptions, initialKey);

  const [rateKey, setRateKey] = useState(initialKey);
  const [text, setText] = useState(initialLabel);
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [mounted, setMounted] = useState(false);
  const committedRef = useRef({ key: initialKey, label: initialLabel });

  const filteredOptions = open
    ? allOptions.filter((item) => {
        if (excluded.has(item.value) && item.value !== rateKey) return false;
        return shippingRateMatchesQuery(item, text);
      })
    : [];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }

    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 240),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, text, filteredOptions.length]);

  function commitOption(option: ShippingFeeCountryOption) {
    setRateKey(option.value);
    setText(option.label);
    committedRef.current = { key: option.value, label: option.label };
    setOpen(false);
  }

  function restoreCommitted() {
    setRateKey(committedRef.current.key);
    setText(committedRef.current.label);
  }

  const menu =
    mounted && open && menuPosition
      ? createPortal(
          <div
            id={listboxId}
            role="listbox"
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              zIndex: 9999,
            }}
            className="overflow-hidden rounded-2xl border border-line bg-white shadow-lg"
          >
            <div className="max-h-60 overflow-auto py-2">
              {filteredOptions.length === 0 ? (
                <p className="px-4 py-2.5 text-sm text-muted">没有匹配的国家</p>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={option.value === rateKey}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm text-ink hover:bg-[#f5f5f5]"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => commitOption(option)}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    <span className="shrink-0 text-muted">{option.value}</span>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={anchorRef} className="relative">
      <input type="hidden" name={name} value={rateKey} required />
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-autocomplete="list"
        value={text}
        placeholder={placeholder}
        autoComplete="off"
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          setOpen(true);
        }}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          if (!e.target.value.trim()) setRateKey("");
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setOpen(false);
            const typed = text.trim().toLowerCase();
            if (!typed) {
              restoreCommitted();
              return;
            }
            const match = findExactMatch(allOptions, typed);
            if (match && !(excluded.has(match.value) && match.value !== committedRef.current.key)) {
              commitOption(match);
              return;
            }
            restoreCommitted();
          }, 0);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        className={
          className ??
          "h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
        }
      />
      {menu}
    </div>
  );
}
