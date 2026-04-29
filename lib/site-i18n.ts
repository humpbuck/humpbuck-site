export type SiteLanguage = "en" | "es";

export function normalizeSiteLanguage(raw: string | null | undefined): SiteLanguage {
  return raw?.toLowerCase() === "es" ? "es" : "en";
}

export function pickSiteLanguageFromLocale(raw: string | null | undefined): SiteLanguage {
  if (!raw) return "en";
  return raw.toLowerCase().startsWith("es") ? "es" : "en";
}

export type SiteDictionary = {
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
  languageShortEn: string;
  languageShortEs: string;
  languageLongEn: string;
  languageLongEs: string;
};

export const SITE_DICTIONARY: Record<SiteLanguage, SiteDictionary> = {
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
    languageShortEn: "EN",
    languageShortEs: "ES",
    languageLongEn: "English",
    languageLongEs: "Spanish",
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
    languageShortEn: "EN",
    languageShortEs: "ES",
    languageLongEn: "Ingles",
    languageLongEs: "Espanol",
  },
};
