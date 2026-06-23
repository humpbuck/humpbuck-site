"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleFlagIcon } from "@/components/site/locale-flag-icons";
import { routing } from "@/i18n/routing";
import type { SiteFabPopoverCoordination } from "@/components/site/site-fab-popover-coordination";

export function LocaleSwitcherFab({
  fabCoordination,
}: {
  fabCoordination: SiteFabPopoverCoordination;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("LocaleSwitcher");
  const rootRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [localPinned, setLocalPinned] = useState(false);
  const [canHoverOpen, setCanHoverOpen] = useState(false);

  const coordinatedOpen = fabCoordination.openMenu === fabCoordination.menuId;
  const open = coordinatedOpen || localPinned || (canHoverOpen && hover);
  const otherLocales = routing.locales.filter((l) => l !== locale);

  const closeMenu = () => {
    fabCoordination.onOpenMenuChange(null);
    setLocalPinned(false);
    setHover(false);
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
    const onScroll = () => closeMenu();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, [open]);

  return (
    <div
      ref={rootRef}
      role="navigation"
      aria-label={t("label")}
      onMouseEnter={() => {
        if (canHoverOpen) setHover(true);
      }}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative inline-block">
        <div
          className={[
            "absolute bottom-full left-0 z-10 mb-1 flex w-max min-w-full flex-col gap-1 transition-[opacity,transform,visibility] duration-200 ease-out",
            // Invisible hit target under the stack fills the gap so hover doesn’t drop while moving to links.
            "after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-2 after:content-['']",
            open
              ? "visible translate-y-0 opacity-100"
              : "invisible translate-y-1 opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <ul
            role="listbox"
            aria-label={t("label")}
            className="m-0 flex list-none flex-col gap-1 overflow-visible p-0"
          >
            {otherLocales.map((loc) => (
              <li key={loc}>
                <Link
                  href={pathname}
                  locale={loc}
                  role="option"
                  className="flex w-full items-center justify-start gap-1.5 whitespace-nowrap rounded-full border border-line bg-paper px-2.5 py-2 pr-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-ink shadow-card transition-colors hover:bg-[color-mix(in_srgb,var(--color-paper)_90%,var(--color-ink)_10%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/25"
                  onClick={() => closeMenu()}
                >
                  <span className="size-[14px] shrink-0" aria-hidden />
                  <LocaleFlagIcon locale={loc} />
                  <span aria-hidden>{loc.toUpperCase()}</span>
                  <span className="sr-only">{t(loc)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-2 pr-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-ink shadow-card transition-colors hover:bg-[color-mix(in_srgb,var(--color-paper)_90%,var(--color-ink)_10%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/25"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => {
            if (open) closeMenu();
            else {
              fabCoordination.onOpenMenuChange(fabCoordination.menuId);
              setLocalPinned(true);
            }
          }}
        >
          <Languages size={14} className="shrink-0 text-muted" aria-hidden />
          <LocaleFlagIcon locale={locale} />
          <span aria-hidden>{locale.toUpperCase()}</span>
          <span className="sr-only">{t(locale)}</span>
        </button>
      </div>
    </div>
  );
}
