"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type SiteLanguage = "en" | "es";

type Dictionary = {
  navShop: string;
  navDigitemp: string;
  navTonneau: string;
  navAstral: string;
  navAffiliates: string;
  navVideoTutorial: string;
  navAbout: string;
  login: string;
  account: string;
  bag: string;
  shippingTax: string;
  refunds: string;
  signOut: string;
  language: string;
};

const DICTIONARY: Record<SiteLanguage, Dictionary> = {
  en: {
    navShop: "Shop",
    navDigitemp: "DIGI-TEMP",
    navTonneau: "RM-TONNEAU",
    navAstral: "RD-ASTRAL",
    navAffiliates: "Affiliates",
    navVideoTutorial: "Video tutorial",
    navAbout: "About",
    login: "Login",
    account: "My account",
    bag: "Bag",
    shippingTax: "Shipping & tax",
    refunds: "Refunds",
    signOut: "Sign out",
    language: "Language",
  },
  es: {
    navShop: "Tienda",
    navDigitemp: "DIGI-TEMP",
    navTonneau: "RM-TONNEAU",
    navAstral: "RD-ASTRAL",
    navAffiliates: "Afiliados",
    navVideoTutorial: "Tutoriales en video",
    navAbout: "Acerca de",
    login: "Iniciar sesion",
    account: "Mi cuenta",
    bag: "Bolsa",
    shippingTax: "Envio e impuestos",
    refunds: "Reembolsos",
    signOut: "Cerrar sesion",
    language: "Idioma",
  },
};

type SiteLanguageContextValue = {
  lang: SiteLanguage;
  setLang: (next: SiteLanguage) => void;
  t: Dictionary;
};

const SiteLanguageContext = createContext<SiteLanguageContextValue | null>(null);

function getInitialLanguage(): SiteLanguage {
  if (typeof document !== "undefined") {
    const m = document.cookie.match(/(?:^|;\s*)site_lang=(en|es)(?:;|$)/);
    if (m?.[1] === "en" || m?.[1] === "es") return m[1];
  }
  if (typeof navigator !== "undefined") {
    const preferred = navigator.language.toLowerCase();
    if (preferred.startsWith("es")) return "es";
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
      setLang: setLangState,
      t: DICTIONARY[lang],
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
