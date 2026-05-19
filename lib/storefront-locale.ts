import type { AbstractIntlMessages } from "next-intl";
import type { Product, SeriesInfo } from "@/lib/catalog";
import { routing } from "@/i18n/routing";

type ProductCopyBlock = {
  name?: string;
  categoryLabel?: string;
  shortDescription?: string;
  description?: string;
  highlights?: string[];
  specs?: { label?: string; value?: string }[];
};

type SeriesCopyBlock = {
  name?: string;
  tagline?: string;
  description?: string;
};

const SPEC_LABELS: Record<string, Record<string, string>> = {
  es: {
    "Case diameter": "Diámetro de la caja",
    "Case thickness": "Grosor de la caja",
    "Band width": "Ancho de la correa",
    Weight: "Peso",
    Crystal: "Cristal",
    "Case material": "Material de la caja",
    Clasp: "Cierre",
    "Water resistance": "Resistencia al agua",
  },
  pt: {
    "Case diameter": "Diâmetro da caixa",
    "Case thickness": "Espessura da caixa",
    "Band width": "Largura da pulseira",
    Weight: "Peso",
    Crystal: "Cristal",
    "Case material": "Material da caixa",
    Clasp: "Fecho",
    "Water resistance": "Resistência à água",
  },
  ru: {
    "Case diameter": "Диаметр корпуса",
    "Case thickness": "Толщина корпуса",
    "Band width": "Ширина ремешка",
    Weight: "Вес",
    Crystal: "Стекло",
    "Case material": "Материал корпуса",
    Clasp: "Застёжка",
    "Water resistance": "Водозащита",
  },
  fr: {
    "Case diameter": "Diamètre du boîtier",
    "Case thickness": "Épaisseur du boîtier",
    "Band width": "Largeur du bracelet",
    Weight: "Poids",
    Crystal: "Verre",
    "Case material": "Matière du boîtier",
    Clasp: "Fermoir",
    "Water resistance": "Étanchéité",
  },
  it: {
    "Case diameter": "Diametro cassa",
    "Case thickness": "Spessore cassa",
    "Band width": "Larghezza cinturino",
    Weight: "Peso",
    Crystal: "Vetro",
    "Case material": "Materiale cassa",
    Clasp: "Chiusura",
    "Water resistance": "Impermeabilità",
  },
};

const SPEC_VALUES: Record<string, Record<string, string>> = {
  es: {
    "Mineral glass": "Cristal mineral",
    "Stainless steel": "Acero inoxidable",
    Polycarbonate: "Policarbonato",
    Alloy: "Aleación",
    "Hook buckle": "Hebilla gancho",
    "Pin buckle": "Hebilla de pin",
    "Butterfly clasp": "Cierre mariposa",
    "Hook & Loop": "Cierre de contacto",
    "30 m": "30 m",
  },
  pt: {
    "Mineral glass": "Vidro mineral",
    "Stainless steel": "Aço inoxidável",
    Polycarbonate: "Policarbonato",
    Alloy: "Liga",
    "Hook buckle": "Fivela gancho",
    "Pin buckle": "Fivela de pino",
    "Butterfly clasp": "Fecho borboleta",
    "Hook & Loop": "Fecho de contato",
    "30 m": "30 m",
  },
  ru: {
    "Mineral glass": "Минеральное стекло",
    "Stainless steel": "Нержавеющая сталь",
    Polycarbonate: "Поликарбонат",
    Alloy: "Сплав",
    "Hook buckle": "Крючковая застёжка",
    "Pin buckle": "Пряжка с штифтом",
    "Butterfly clasp": "Застёжка-бабочка",
    "Hook & Loop": "Липучка",
    "30 m": "30 м",
  },
  fr: {
    "Mineral glass": "Verre minéral",
    "Stainless steel": "Acier inoxydable",
    Polycarbonate: "Polycarbonate",
    Alloy: "Alliage",
    "Hook buckle": "Boucle crochet",
    "Pin buckle": "Boucle ardillon",
    "Butterfly clasp": "Fermoir papillon",
    "Hook & Loop": "Fermoir auto-agrippant",
    "30 m": "30 m",
  },
  it: {
    "Mineral glass": "Vetro minerale",
    "Stainless steel": "Acciaio inossidabile",
    Polycarbonate: "Policarbonato",
    Alloy: "Lega",
    "Hook buckle": "Fibbia a gancio",
    "Pin buckle": "Fibbia a spillo",
    "Butterfly clasp": "Chiusura a farfalla",
    "Hook & Loop": "Chiusura a strappo",
    "30 m": "30 m",
  },
};

const VARIANT_STYLE_PREFIX: Record<string, string> = {
  es: "Estilo",
  pt: "Estilo",
  ru: "Стиль",
  fr: "Style",
  it: "Stile",
};

function localizeVariantLabel(label: string, locale: string): string {
  const m = /^Style\s+(\d{1,2})$/i.exec(label.trim());
  const prefix = VARIANT_STYLE_PREFIX[locale];
  if (!m || !prefix) return label;
  return `${prefix} ${Number(m[1])}`;
}

function readProductCopy(
  messages: AbstractIntlMessages,
  slug: string,
): ProductCopyBlock | undefined {
  const root = messages.ProductCopy as Record<string, ProductCopyBlock> | undefined;
  const block = root?.[slug];
  if (!block || typeof block !== "object") return undefined;
  return block;
}

function readSeriesCopy(
  messages: AbstractIntlMessages,
  seriesSlug: string,
): SeriesCopyBlock | undefined {
  const root = messages.SeriesCopy as Record<string, SeriesCopyBlock> | undefined;
  const block = root?.[seriesSlug];
  if (!block || typeof block !== "object") return undefined;
  return block;
}

/** Series hero copy for PDP/series pages (DB/catalog stays canonical for `en`). */
export function getLocalizedSeriesFields(
  series: SeriesInfo,
  locale: string,
  messages: AbstractIntlMessages,
): { name: string; tagline: string; description: string } {
  if (locale === routing.defaultLocale) {
    return {
      name: series.name,
      tagline: series.tagline,
      description: series.description,
    };
  }
  const copy = readSeriesCopy(messages, series.slug);
  return {
    name: copy?.name?.trim() || series.name,
    tagline: copy?.tagline?.trim() || series.tagline,
    description: copy?.description?.trim() || series.description,
  };
}

/** Merge optional per-locale catalog overrides + shared label localization. */
export function applyStorefrontProductLocale(
  product: Product,
  locale: string,
  messages: AbstractIntlMessages,
): Product {
  if (locale === routing.defaultLocale) {
    return product;
  }

  const copy = readProductCopy(messages, product.slug);
  const next: Product = {
    ...product,
    highlights: [...product.highlights],
    specs: product.specs.map((s) => ({ ...s })),
    variantOptions: product.variantOptions?.map((v) => ({ ...v })),
  };

  if (copy?.name?.trim()) next.name = copy.name.trim();
  if (copy?.categoryLabel?.trim()) next.categoryLabel = copy.categoryLabel.trim();
  if (copy?.shortDescription != null) next.shortDescription = copy.shortDescription;
  if (copy?.description != null) next.description = copy.description;

  if (copy?.highlights?.length) {
    next.highlights = copy.highlights.filter((h) => typeof h === "string" && h.trim());
  }

  if (copy?.specs?.length) {
    next.specs = copy.specs
      .filter((s) => s && (s.label || s.value))
      .map((s) => ({
        label: String(s.label ?? "").trim(),
        value: String(s.value ?? "").trim(),
      }));
  } else {
    const specLabels = SPEC_LABELS[locale] ?? {};
    const specValues = SPEC_VALUES[locale] ?? {};
    next.specs = next.specs.map((row) => ({
      ...row,
      label: row.label ? (specLabels[row.label] ?? row.label) : row.label,
      value: row.value ? (specValues[row.value] ?? row.value) : row.value,
    }));
  }

  if (next.variantOptions?.length) {
    next.variantOptions = next.variantOptions.map((v) => ({
      ...v,
      label: localizeVariantLabel(v.label, locale),
    }));
  }

  return next;
}
