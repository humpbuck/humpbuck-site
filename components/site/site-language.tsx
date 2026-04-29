"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  normalizeSiteLanguage,
  pickSiteLanguageFromLocale,
  SITE_DICTIONARY,
  type SiteDictionary,
  type SiteLanguage,
} from "@/lib/site-i18n";

type SiteLanguageContextValue = {
  lang: SiteLanguage;
  setLang: (next: SiteLanguage) => void;
  t: SiteDictionary;
};

const SiteLanguageContext = createContext<SiteLanguageContextValue | null>(null);

function getInitialLanguage(): SiteLanguage {
  if (typeof document !== "undefined") {
    const m = document.cookie.match(/(?:^|;\s*)site_lang=(en|es)(?:;|$)/);
    if (m?.[1]) return normalizeSiteLanguage(m[1]);
  }
  if (typeof navigator !== "undefined") {
    const fromMany = navigator.languages?.find((x) => x && x.length > 0);
    return pickSiteLanguageFromLocale(fromMany ?? navigator.language);
  }
  return "en";
}

export function SiteLanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<SiteLanguage>(getInitialLanguage);

  useEffect(() => {
    document.cookie = `site_lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, [lang]);

  const value = useMemo<SiteLanguageContextValue>(
    () => ({
      lang,
      setLang: (next: SiteLanguage) => setLangState(normalizeSiteLanguage(next)),
      t: SITE_DICTIONARY[lang],
    }),
    [lang],
  );

  return (
    <SiteLanguageContext.Provider value={value}>
      {children}
    </SiteLanguageContext.Provider>
  );
}

export function useSiteLanguage() {
  const ctx = useContext(SiteLanguageContext);
  if (!ctx) {
    throw new Error("useSiteLanguage must be used within SiteLanguageProvider");
  }
  return ctx;
}
