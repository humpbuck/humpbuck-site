"use client";

import { useSiteLanguage } from "@/components/site/site-language";

export function LanguageFloatingSelector() {
  const { lang, setLang, t } = useSiteLanguage();

  return (
    <div className="fixed bottom-6 left-6 z-40 rounded-2xl border border-white/35 bg-paper/92 px-3 py-2 shadow-lg backdrop-blur-md md:bottom-8 md:left-8">
      <label
        htmlFor="site-language-floating-select"
        className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/60"
      >
        {t.language}
      </label>
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-base">
          {lang === "es" ? "🇪🇸" : "🇬🇧"}
        </span>
        <select
          id="site-language-floating-select"
          value={lang}
          onChange={(e) => setLang(e.target.value === "es" ? "es" : "en")}
          className="rounded-xl border border-line bg-white px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink/85"
          aria-label={t.language}
        >
          <option value="en">
            🇬🇧 {t.languageShortEn}
          </option>
          <option value="es">
            🇪🇸 {t.languageShortEs}
          </option>
        </select>
      </div>
    </div>
  );
}
