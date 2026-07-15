"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  countryNameForShippingRateKey,
  listShippingFeeCountryOptions,
  type ShippingFeeCountryOption,
} from "@/lib/shipping-fee-country-options";

type Props = {
  name: string;
  defaultValue?: string;
  className?: string;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

function normalizeQuery(text: string): string {
  return text.trim().toLowerCase();
}

function labelForRateKey(options: ShippingFeeCountryOption[], rateKey: string): string {
  const key = rateKey.trim().toUpperCase();
  if (!key) return "";
  return options.find((option) => option.value === key)?.label ?? countryNameForShippingRateKey(key);
}

function filterCountryOptions(options: ShippingFeeCountryOption[], query: string): ShippingFeeCountryOption[] {
  if (!query) return options;
  return options.filter((item) => {
    const label = item.label.toLowerCase();
    const value = item.value.toLowerCase();
    return (
      value.startsWith(query) ||
      label.startsWith(query) ||
      label.split(/\s+/).some((word) => word.startsWith(query))
    );
  });
}

function findExactMatch(
  options: ShippingFeeCountryOption[],
  query: string,
): ShippingFeeCountryOption | null {
  if (!query) return null;
  return (
    options.find(
      (item) =>
        item.value.toLowerCase() === query ||
        item.label.toLowerCase() === query ||
        item.label.toLowerCase().startsWith(`${query} (`),
    ) ?? null
  );
}

export function ShippingFeeCountrySelect({ name, defaultValue, className }: Props) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const anchorRef = useRef<HTMLDivElement>(null);
  const allOptions = useMemo(() => listShippingFeeCountryOptions(), []);

  const initialKey = defaultValue?.trim().toUpperCase() ?? "";
  const initialLabel = labelForRateKey(allOptions, initialKey);

  const [rateKey, setRateKey] = useState(initialKey);
  const [text, setText] = useState(initialLabel);
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [mounted, setMounted] = useState(false);
  const committedRef = useRef({ key: initialKey, label: initialLabel });

  const query = normalizeQuery(text);
  const filteredOptions = open ? filterCountryOptions(allOptions, query) : [];

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
    mounted && open && menuPosition && filteredOptions.length > 0
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
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === rateKey}
                  className="flex w-full px-4 py-2.5 text-left text-sm text-ink hover:bg-[#f5f5f5]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commitOption(option)}
                >
                  {option.label}
                </button>
              ))}
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
        aria-expanded={open && filteredOptions.length > 0}
        aria-controls={open && filteredOptions.length > 0 ? listboxId : undefined}
        aria-autocomplete="list"
        value={text}
        placeholder="Select country / region"
        autoComplete="off"
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          setOpen(true);
        }}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setOpen(false);
            const typed = normalizeQuery(text);
            if (!typed) {
              restoreCommitted();
              return;
            }
            const match = findExactMatch(allOptions, typed);
            if (match) {
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
          "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
        }
      />
      {menu}
    </div>
  );
}
