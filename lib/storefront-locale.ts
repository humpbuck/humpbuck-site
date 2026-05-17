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

const ES_SPEC_LABELS: Record<string, string> = {
  "Case diameter": "Diámetro de la caja",
  "Case thickness": "Grosor de la caja",
  "Band width": "Ancho de la correa",
  "Weight": "Peso",
  Crystal: "Cristal",
  "Case material": "Material de la caja",
  Clasp: "Cierre",
  "Water resistance": "Resistencia al agua",
};

const ES_SPEC_VALUES: Record<string, string> = {
  "Mineral glass": "Cristal mineral",
  "Stainless steel": "Acero inoxidable",
  Polycarbonate: "Policarbonato",
  Alloy: "Aleación",
  "Hook buckle": "Hebilla gancho",
  "Pin buckle": "Hebilla de pin",
  "Butterfly clasp": "Cierre mariposa",
  "Hook & Loop": "Cierre de contacto",
  "30 m": "30 m",
};

function localizeVariantLabelEs(label: string): string {
  const m = /^Style\s+(\d{1,2})$/i.exec(label.trim());
  if (m) return `Estilo ${Number(m[1])}`;
  return label;
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
    next.specs = next.specs.map((row) => ({
      ...row,
      label: row.label ? (ES_SPEC_LABELS[row.label] ?? row.label) : row.label,
      value: row.value ? (ES_SPEC_VALUES[row.value] ?? row.value) : row.value,
    }));
  }

  if (next.variantOptions?.length) {
    next.variantOptions = next.variantOptions.map((v) => ({
      ...v,
      label: localizeVariantLabelEs(v.label),
    }));
  }

  return next;
}
