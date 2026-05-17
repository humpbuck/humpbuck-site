"use client";

import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/** Fixed bottom-left; pairs with WhatsApp (right) and scroll-to-top (right). */
export function LocaleSwitcherFab() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("LocaleSwitcher");

  return (
    <div
      className="fixed bottom-6 left-6 z-40 flex items-center gap-1 rounded-full border border-line bg-paper/95 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-card backdrop-blur-sm md:bottom-8 md:left-8"
      role="group"
      aria-label={t("label")}
    >
      <Languages size={14} className="shrink-0 text-muted" aria-hidden />
      {routing.locales.map((loc) => (
        <Link
          key={loc}
          href={pathname}
          locale={loc}
          className={
            locale === loc
              ? "rounded-full bg-ink px-2.5 py-1 text-paper"
              : "rounded-full px-2.5 py-1 text-ink/75 transition hover:bg-ink/[0.06] hover:text-ink"
          }
        >
          {loc.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
