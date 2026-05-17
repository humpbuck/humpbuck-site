"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleFlagIcon } from "@/components/site/locale-flag-icons";
import { routing } from "@/i18n/routing";

/** Fixed bottom-left; pairs with WhatsApp (right) and scroll-to-top (right). */
export function LocaleSwitcherFab() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("LocaleSwitcher");
  const rootRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);

  const open = hover || pinned;
  const otherLocales = routing.locales.filter((l) => l !== locale);

  const closeMenu = () => {
    setPinned(false);
    setHover(false);
  };

  useEffect(() => {
    if (!pinned) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setPinned(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [pinned]);

  return (
    <div
      ref={rootRef}
      className="fixed bottom-6 left-6 z-40 md:bottom-8 md:left-8"
      role="navigation"
      aria-label={t("label")}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPinned(false);
      }}
    >
      <div className="relative inline-block">
        <div
          className={[
            "absolute bottom-full left-0 right-0 z-10 mb-1 flex flex-col gap-1 transition-[opacity,transform,visibility] duration-200 ease-out",
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
            className="m-0 flex max-h-[min(12rem,calc(100vh-8rem))] list-none flex-col gap-1 overflow-y-auto overscroll-y-contain p-0 snap-y snap-mandatory"
          >
            {otherLocales.map((loc) => (
              <li key={loc} className="snap-start">
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
          onClick={() => setPinned((p) => !p)}
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
