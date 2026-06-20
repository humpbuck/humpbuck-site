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
  /** PDP closer-look blocks — matched by index to catalog `detailBlocks`. */
  detailBlocks?: { title?: string; body?: string }[];
};

type SeriesCopyBlock = {
  name?: string;
  tagline?: string;
  description?: string;
};

/** Catalog titles like "Mechanical 9027" → localized "mechanical watch" + model. */
const PRODUCT_NAME_PREFIX: Record<string, { mechanical: string; quartz: string }> = {
  ar: { mechanical: "ساعة ميكانيكية", quartz: "ساعة كوارتز" },
  de: { mechanical: "Mechanische Uhr", quartz: "Quarzuhr" },
  es: { mechanical: "Reloj mecánico", quartz: "Reloj de cuarzo" },
  fr: { mechanical: "Montre mécanique", quartz: "Montre quartz" },
  he: { mechanical: "שעון מכני", quartz: "שעון קварץ" },
  hu: { mechanical: "Mechanikus óra", quartz: "Kvartz óra" },
  it: { mechanical: "Orologio meccanico", quartz: "Orologio al quarzo" },
  ja: { mechanical: "機械式時計", quartz: "クォーツ時計" },
  ko: { mechanical: "기계식 시계", quartz: "쿼츠 시계" },
  nl: { mechanical: "Mechanisch horloge", quartz: "Quarzhorloge" },
  pt: { mechanical: "Relógio mecânico", quartz: "Relógio de quartzo" },
  ru: { mechanical: "Механические часы", quartz: "Кварцевые часы" },
};

function localizeCatalogProductName(name: string, locale: string): string {
  const prefix = PRODUCT_NAME_PREFIX[locale];
  if (!prefix) return name;
  const mechanical = /^Mechanical\s+(.+)$/i.exec(name.trim());
  if (mechanical) return `${prefix.mechanical} ${mechanical[1]}`;
  const quartz = /^Quartz\s+(.+)$/i.exec(name.trim());
  if (quartz) return `${prefix.quartz} ${quartz[1]}`;
  return name;
}

const SPEC_LABELS: Record<string, Record<string, string>> = {
  es: {
    "Case diameter": "Diámetro de la caja",
    "Case thickness": "Grosor de la caja",
    "Band width": "Ancho de la correa",
    "Band material": "Material de la correa",
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
    "Band material": "Material da pulseira",
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
    "Band material": "Материал ремешка",
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
    "Band material": "Matière du bracelet",
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
    "Band material": "Materiale cinturino",
    Weight: "Peso",
    Crystal: "Vetro",
    "Case material": "Materiale cassa",
    Clasp: "Chiusura",
    "Water resistance": "Impermeabilità",
  },
  nl: {
    "Case diameter": "Kastdiameter",
    "Case thickness": "Kastdikte",
    "Band width": "Bandbreedte",
    "Band material": "Bandmateriaal",
    Weight: "Gewicht",
    Crystal: "Glas",
    "Case material": "Kastmateriaal",
    Clasp: "Sluiting",
    "Water resistance": "Waterdichtheid",
  },
  hu: {
    "Case diameter": "Tok átmérő",
    "Case thickness": "Tok vastagság",
    "Band width": "Szíj szélesség",
    "Band material": "Szíj anyaga",
    Weight: "Súly",
    Crystal: "Üveg",
    "Case material": "Tok anyaga",
    Clasp: "Csat",
    "Water resistance": "Vízállóság",
  },
  ko: {
    "Case diameter": "케이스 직경",
    "Case thickness": "케이스 두께",
    "Band width": "밴드 너비",
    "Band material": "밴드 소재",
    Weight: "무게",
    Crystal: "글래스",
    "Case material": "케이스 소재",
    Clasp: "잠금장치",
    "Water resistance": "방수",
  },
  de: {
    "Case diameter": "Gehäusedurchmesser",
    "Case thickness": "Gehäusehöhe",
    "Band width": "Bandbreite",
    "Band material": "Bandmaterial",
    Weight: "Gewicht",
    Crystal: "Glas",
    "Case material": "Gehäusematerial",
    Clasp: "Schließe",
    "Water resistance": "Wasserdichtigkeit",
  },
  ja: {
    "Case diameter": "ケース径",
    "Case thickness": "ケース厚",
    "Band width": "バンド幅",
    "Band material": "バンド素材",
    Weight: "重量",
    Crystal: "ガラス",
    "Case material": "ケース素材",
    Clasp: "バックル",
    "Water resistance": "防水",
  },
  he: {
    "Case diameter": "קוטר הבית",
    "Case thickness": "עובי הבית",
    "Band width": "רוחב הרצועה",
    "Band material": "חומר הרצועה",
    Weight: "משקל",
    Crystal: "זכוכית",
    "Case material": "חומר הבית",
    Clasp: "סוגר",
    "Water resistance": "עמידות במים",
  },
  ar: {
    "Case diameter": "قطر الهيكل",
    "Case thickness": "سُمك الهيكل",
    "Band width": "عرض السوار",
    "Band material": "مادة السوار",
    Weight: "الوزن",
    Crystal: "الزجاج",
    "Case material": "مادة الهيكل",
    Clasp: "الإبزيم",
    "Water resistance": "مقاومة الماء",
  },
};

/** Admin catalog often stores mechanical spec labels in ALL CAPS. */
const SPEC_LABEL_ALIASES: Record<string, string> = {
  "CASE DIAMETER": "Case diameter",
  "CASE THICKNESS": "Case thickness",
  "BAND WIDTH": "Band width",
  "BAND MATERIAL": "Band material",
  WEIGHT: "Weight",
  CRYSTAL: "Crystal",
  "CASE MATERIAL": "Case material",
  "WATER RESISITANCE": "Water resistance",
  "WATER RESISTANCE": "Water resistance",
};

function resolveSpecLabel(
  labels: Record<string, string>,
  raw: string,
): string {
  const key = SPEC_LABEL_ALIASES[raw] ?? raw;
  return labels[key] ?? labels[raw] ?? raw;
}

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
  nl: {
    "Mineral glass": "Mineraalglas",
    "Stainless steel": "Roestvrij staal",
    Polycarbonate: "Polycarbonaat",
    Alloy: "Legering",
    "Hook buckle": "Haakgesp",
    "Pin buckle": "Pennegesp",
    "Butterfly clasp": "Vlindersluiting",
    "Hook & Loop": "Klittenbandsluiting",
    "30 m": "30 m",
  },
  hu: {
    "Mineral glass": "Ásványi üveg",
    "Stainless steel": "Rozsdamentes acél",
    Polycarbonate: "Polikarbonát",
    Alloy: "Ötvözet",
    "Hook buckle": "Kampós csat",
    "Pin buckle": "Tűcsat",
    "Butterfly clasp": "Pillangó csat",
    "Hook & Loop": "Tépőzáras csat",
    "30 m": "30 m",
  },
  ko: {
    "Mineral glass": "미네랄 글래스",
    "Stainless steel": "스테인리스 스틸",
    Polycarbonate: "폴리보네이트",
    Alloy: "합금",
    "Hook buckle": "후크 버클",
    "Pin buckle": "핀 버클",
    "Butterfly clasp": "버터플라이 클라스프",
    "Hook & Loop": "벨크로",
    "30 m": "30 m",
  },
  de: {
    "Mineral glass": "Mineralglas",
    "Stainless steel": "Edelstahl",
    Polycarbonate: "Polycarbonat",
    Alloy: "Legierung",
    "Hook buckle": "Hakenschliesse",
    "Pin buckle": "Stiftschliesse",
    "Butterfly clasp": "Faltschließe",
    "Hook & Loop": "Klettverschluss",
    "30 m": "30 m",
  },
  ja: {
    "Mineral glass": "ミネラルガラス",
    "Stainless steel": "ステンレススチール",
    Polycarbonate: "ポリカーボネート",
    Alloy: "合金",
    "Hook buckle": "フックバックル",
    "Pin buckle": "ピンバックル",
    "Butterfly clasp": "バタフライクラスプ",
    "Hook & Loop": "マジックテープ",
    "30 m": "30 m",
  },
  he: {
    "Mineral glass": "זכוכית מינרלית",
    "Stainless steel": "פלדת אל-חלד",
    Polycarbonate: "פוליקרבונט",
    Alloy: "סגסוגת",
    "Hook buckle": "אבזם וו",
    "Pin buckle": "אבזם סיכה",
    "Butterfly clasp": "סוגר פרפר",
    "Hook & Loop": "סגירת וולקרו",
    "30 m": "30 מ'",
  },
  ar: {
    "Mineral glass": "زجاج معدني",
    "Stainless steel": "فولاذ مقاوم للصدأ",
    Polycarbonate: "بولي كربونات",
    Alloy: "سبيكة",
    "Hook buckle": "إبزيم خطاف",
    "Pin buckle": "إبزيم دبوس",
    "Butterfly clasp": "مشبك فراشة",
    "Hook & Loop": "لصق ولف",
    "30 m": "30 م",
  },
};

const VARIANT_STYLE_PREFIX: Record<string, string> = {
  es: "Estilo",
  pt: "Estilo",
  ru: "Стиль",
  fr: "Style",
  it: "Stile",
  nl: "Stijl",
  hu: "Stílus",
  ko: "스타일",
  de: "Stil",
  ja: "スタイル",
  he: "סגנון",
  ar: "النمط",
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
    detailBlocks: product.detailBlocks?.map((b) => ({ ...b })),
  };

  if (copy?.name?.trim()) next.name = copy.name.trim();
  else next.name = localizeCatalogProductName(product.name, locale);
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
      label: row.label ? resolveSpecLabel(specLabels, row.label) : row.label,
      value: row.value ? (specValues[row.value] ?? row.value) : row.value,
    }));
  }

  if (next.variantOptions?.length) {
    next.variantOptions = next.variantOptions.map((v) => ({
      ...v,
      label: localizeVariantLabel(v.label, locale),
    }));
  }

  if (copy?.detailBlocks?.length && next.detailBlocks?.length) {
    next.detailBlocks = next.detailBlocks.map((block, index) => {
      const translated = copy.detailBlocks?.[index];
      if (!translated) return block;
      return {
        ...block,
        title: translated.title?.trim() ? translated.title.trim() : block.title,
        body: translated.body?.trim() ? translated.body.trim() : block.body,
      };
    });
  }

  return next;
}
