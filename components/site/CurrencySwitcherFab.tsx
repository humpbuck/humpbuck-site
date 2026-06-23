"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Coins } from "lucide-react";
import { CurrencyFlagIcon } from "@/components/site/currency-flag-icons";
import { useDisplayCurrency } from "@/components/site/display-currency-context";
import {
  DISPLAY_CURRENCIES,
  DISPLAY_CURRENCY_BY_CODE,
  type DisplayCurrencyCode,
} from "@/lib/display-currency";
import type { SiteFabPopoverCoordination } from "@/components/site/site-fab-popover-coordination";

const FAB_OPTION_CLASS =
  "flex w-full items-center justify-start gap-1.5 whitespace-nowrap rounded-full border border-line bg-paper px-2.5 py-2 pr-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-ink shadow-card transition-colors hover:bg-[color-mix(in_srgb,var(--color-paper)_90%,var(--color-ink)_10%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/25";

const FAB_TRIGGER_CLASS =
  "inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-2 pr-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-ink shadow-card transition-colors hover:bg-[color-mix(in_srgb,var(--color-paper)_90%,var(--color-ink)_10%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/25";

const HOVER_LEAVE_MS = 220;

export function CurrencySwitcherFab({
  fabCoordination,
}: {
  fabCoordination: SiteFabPopoverCoordination;
}) {
  const t = useTranslations("DisplayCurrency");
  const { currency, setCurrency } = useDisplayCurrency();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const leaveTimerRef = useRef<number | null>(null);
  const [hover, setHover] = useState(false);
  const [canHoverOpen, setCanHoverOpen] = useState(false);

  const coordinatedOpen = fabCoordination.openMenu === fabCoordination.menuId;
  const [localPinned, setLocalPinned] = useState(false);
  const open = coordinatedOpen || localPinned || (canHoverOpen && hover);

  const closeMenu = () => {
    fabCoordination.onOpenMenuChange(null);
    setLocalPinned(false);
    setHover(false);
  };

  const pinMenuOpen = () => {
    fabCoordination.onOpenMenuChange(fabCoordination.menuId);
    setLocalPinned(true);
    setHover(true);
  };

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setCanHoverOpen(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!coordinatedOpen && !localPinned) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [coordinatedOpen, localPinned]);

  useEffect(() => {
    if (!open) return;
    const onScroll = (e: Event) => {
      const target = e.target;
      if (
        listRef.current &&
        (target === listRef.current || listRef.current.contains(target as Node))
      ) {
        return;
      }
      closeMenu();
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, [open]);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current != null) {
        window.clearTimeout(leaveTimerRef.current);
      }
    };
  }, []);

  const activeMeta = DISPLAY_CURRENCY_BY_CODE[currency];

  const selectCurrency = (code: DisplayCurrencyCode) => {
    setCurrency(code);
    closeMenu();
  };

  const toggleOpen = () => {
    if (open) {
      closeMenu();
    } else {
      pinMenuOpen();
    }
  };

  const handleMouseEnter = () => {
    if (leaveTimerRef.current != null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (canHoverOpen) setHover(true);
  };

  const handleMouseLeave = () => {
    if (localPinned || coordinatedOpen) return;
    if (leaveTimerRef.current != null) window.clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = window.setTimeout(() => {
      setHover(false);
      leaveTimerRef.current = null;
    }, HOVER_LEAVE_MS);
  };

  return (
    <div
      ref={rootRef}
      role="navigation"
      aria-label={t("label")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative inline-block">
        <div
          className={[
            "absolute bottom-full left-0 z-10 mb-1 flex w-max min-w-full flex-col gap-1 transition-[opacity,transform,visibility] duration-200 ease-out",
            "after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-2 after:content-['']",
            open
              ? "visible translate-y-0 opacity-100"
              : "invisible translate-y-1 opacity-0 pointer-events-none",
          ].join(" ")}
          onPointerDown={() => {
            if (!localPinned && !coordinatedOpen) pinMenuOpen();
          }}
        >
          <ul
            ref={listRef}
            role="listbox"
            aria-label={t("label")}
            className="m-0 flex max-h-[70vh] list-none flex-col gap-1 overflow-y-auto overflow-x-hidden overscroll-contain p-0 pr-0.5 [scrollbar-gutter:stable]"
          >
            {DISPLAY_CURRENCIES.map((meta) => {
              const selected = meta.code === currency;
              return (
                <li key={meta.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={[
                      FAB_OPTION_CLASS,
                      selected ? "ring-1 ring-ink/15" : "",
                    ].join(" ")}
                    onClick={() => selectCurrency(meta.code)}
                  >
                    <span className="size-[14px] shrink-0" aria-hidden />
                    <CurrencyFlagIcon code={meta.code} />
                    <span aria-hidden>{meta.code}</span>
                    <span className="sr-only">{meta.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          type="button"
          className={FAB_TRIGGER_CLASS}
          title={t("label")}
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={toggleOpen}
        >
          <Coins size={14} className="shrink-0 text-muted" aria-hidden />
          <CurrencyFlagIcon code={currency} />
          <span aria-hidden>{activeMeta.code}</span>
          <span className="sr-only">{activeMeta.label}</span>
        </button>
      </div>
    </div>
  );
}
