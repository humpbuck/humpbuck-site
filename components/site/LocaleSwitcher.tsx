"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("LocaleSwitcher");

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted"
      role="group"
      aria-label={t("label")}
    >
      {routing.locales.map((loc) => (
        <Link
          key={loc}
          href={pathname}
          locale={loc}
          className={
            locale === loc
              ? "font-semibold text-ink"
              : "underline-offset-2 hover:text-ink hover:underline"
          }
        >
          {t(loc)}
        </Link>
      ))}
    </div>
  );
}
