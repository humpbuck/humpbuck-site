import isoRaw from "@/lib/data/iso-3166-countries.json";
import ratesJson from "@/lib/data/logistics-rates.json";
import { isUsStateExcludedFromEconomyCarriers } from "@/lib/logistics-economy-us";
import { deriveYanwenLaneZoneDigit } from "@/lib/yanwen-postcode-zones";

type IsoRow = { name: string; "alpha-2": string };

type Band = {
  wMin: number;
  wMax: number;
  rmbPerKg: number;
  regRmb: number;
};

type YanwenBand = {
  wMin: number | null;
  wMax: number | null;
  rmbPerKg: number;
  pieceRmb: number;
  minChargeKg: number | null;
};

/** Per ISO: fees from carrier rate-sheet 备注 (customs/VAT/etc.), added on top of lane quotes. */
export type CountryDestinationFeeDef = {
  /** One-shot destination charges (e.g. clearance per shipment), CNY. */
  flatCnyPerShipment?: number;
  /**
   * VAT-style charge: rate × declared goods value in CNY (order subtotal × FX as CIF proxy).
   * Omit duty when unknown (matches “关税如有” — none → 0).
   */
  vatRateOnDeclaredCifCny?: number;
  /** Shown in admin / summaries (optional). */
  label?: string;
};

type RatesFile = {
  cainiaoVolumetricDivisor: number;
  yanwenVolumetricDivisor: number;
  yanwenDomesticToWarehouseCny: number;
  freeInternationalLegCny: number;
  cainiaoPreferenceMarginCny: number;
  /** ISO2 → fees from destination-country remarks (see logistics-rates.json). */
  countryDestinationFees?: Record<string, CountryDestinationFeeDef>;
  cainiao: { S5059: Record<string, Band[]>; OH: Record<string, Band[]> };
  /** When main S5059/OH sheets omit a destination (e.g. HK), per-ISO bands — edit manually. */
  cainiaoIsoFallback?: Record<
    string,
    { S5059?: Band[]; OH?: Band[] }
  >;
  /** Per ISO: flat band list, or zone map `"1"…"4"` (Australia / Canada Yanwen 484). */
  yanwen484: Record<string, YanwenBand[] | Record<string, YanwenBand[]>>;
  cainiaoCountryToIso: Record<string, string>;
};

export type Yanwen484CountryEntry = YanwenBand[] | Record<string, YanwenBand[]>;

const R = ratesJson as RatesFile;

const ISO_BY_NORMALIZED_NAME: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const r of isoRaw as IsoRow[]) {
    m.set(normalizeCountryKey(r.name), r["alpha-2"].toUpperCase());
  }
  m.set("united states", "US");
  m.set("usa", "US");
  m.set("u.s.", "US");
  m.set("u.s.a.", "US");
  m.set("uk", "GB");
  m.set("united kingdom", "GB");
  m.set("great britain", "GB");
  m.set("england", "GB");
  // Common localized spellings / legacy labels.
  m.set("brasil", "BR");
  return m;
})();

const KNOWN_ISO2_CODES: Set<string> = (() => {
  const s = new Set<string>();
  for (const r of isoRaw as IsoRow[]) {
    const iso = String(r["alpha-2"] ?? "").toUpperCase();
    if (/^[A-Z]{2}$/.test(iso)) s.add(iso);
  }
  return s;
})();

function normalizeCountryKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,']/g, "");
}

/** Resolve checkout / admin country field to ISO 3166-1 alpha-2. */
export function countryLabelToIso2(country: string | null | undefined): string | null {
  if (!country?.trim()) return null;
  const raw = country.trim();
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase();
  const key = normalizeCountryKey(raw);
  const direct = ISO_BY_NORMALIZED_NAME.get(key);
  if (direct) return direct;

  // Robust fallback for composed labels like "Brazil (BR)" / "BR - Brazil".
  const tokens = raw.match(/[A-Za-z]{2,}/g) ?? [];
  for (const t of tokens) {
    const up = t.toUpperCase();
    if (/^[A-Z]{2}$/.test(up) && KNOWN_ISO2_CODES.has(up)) return up;
  }

  return null;
}

function invertCainiaoZhToIso(): Record<string, string> {
  const inv: Record<string, string> = {};
  for (const [zh, iso] of Object.entries(R.cainiaoCountryToIso)) {
    if (typeof iso !== "string" || iso.length !== 2 || !/^[A-Z]{2}$/i.test(iso)) {
      continue;
    }
    const u = iso.toUpperCase();
    if (!(u in inv)) inv[u] = zh;
  }
  return inv;
}

const ISO_TO_CAINIAO_ZH = invertCainiaoZhToIso();

function resolveMalaysiaCainiaoZhCountry(state: string | null | undefined): string {
  const raw = String(state ?? "").trim();
  const key = normalizeCountryKey(raw);
  // East Malaysia (Borneo) states/federal territory.
  if (
    key.includes("sabah") ||
    key.includes("sarawak") ||
    key.includes("labuan") ||
    key.includes("东马") ||
    key === "my-12" ||
    key === "my12" ||
    key === "my-13" ||
    key === "my13" ||
    key === "my-15" ||
    key === "my15"
  ) {
    return "马来西亚/东马";
  }
  // Default to West Malaysia for unknown/blank input.
  return "马来西亚/西马";
}

function resolvePhilippinesCainiaoZhCountry(state: string | null | undefined): string {
  const raw = String(state ?? "").trim();
  const key = normalizeCountryKey(raw);
  // Metro Manila / NCR.
  if (
    key.includes("metro manila") ||
    key.includes("manila") ||
    key.includes("ncr") ||
    key.includes("national capital region") ||
    key.includes("菲律宾马尼拉大都")
  ) {
    return "菲律宾/菲律宾马尼拉大都";
  }
  // Default to "other regions" for unknown/blank input.
  return "菲律宾/菲律宾其他地区";
}

/**
 * Cainiao S5059/OH row key. Australia uses `澳大利亚/N区` — same N as Yanwen lane (1–4),
 * from `effectiveZonedLaneDigit` (postcode first).
 */
export function resolveCainiaoZhCountry(
  iso2: string,
  yanwenZone: string | null | undefined,
): string | null {
  if (iso2 === "AU") {
    const zRaw = String(yanwenZone ?? "").trim();
    if (!/^[1-4]$/.test(zRaw)) return null;
    const zoned = `澳大利亚/${zRaw}区`;
    if (R.cainiao.S5059[zoned]?.length || R.cainiao.OH[zoned]?.length) {
      return zoned;
    }
    return null;
  }
  return ISO_TO_CAINIAO_ZH[iso2] ?? null;
}

function getCainiaoBands(
  iso2: string,
  zh: string | null,
  product: "S5059" | "OH",
): Band[] | undefined {
  if (zh) {
    const main = R.cainiao[product][zh];
    if (main?.length) return main;
  }
  const fb = R.cainiaoIsoFallback?.[iso2]?.[product];
  if (fb?.length) return fb;
  return undefined;
}

function pickCainiaoBand(weightKg: number, bands: Band[] | undefined): Band | null {
  if (!bands?.length) return null;
  const w = weightKg;
  for (const b of bands) {
    const lowOk = w > b.wMin || (b.wMin === 0 && w > 0);
    const highOk = w <= b.wMax;
    if (lowOk && highOk) return b;
  }
  return null;
}

/**
 * Cainiao lightweight S5059: carrier rule — billable weight must not exceed this (kg).
 * Above it, only OH (or other products) apply; e.g. 2×200g units → 0.4 kg → no S5059.
 */
export const CAINIAO_S5059_MAX_CHARGEABLE_KG = 0.2;

function cainiaoInternationalCny(
  weightKg: number,
  iso2: string,
  zhCountry: string | null,
  product: "S5059" | "OH",
): number | null {
  if (
    product === "S5059" &&
    weightKg > CAINIAO_S5059_MAX_CHARGEABLE_KG + 1e-9
  ) {
    return null;
  }
  const bands = getCainiaoBands(iso2, zhCountry, product);
  const b = pickCainiaoBand(weightKg, bands);
  if (!b) return null;
  return Math.round((b.rmbPerKg * weightKg + b.regRmb) * 100) / 100;
}

function pickYanwenBand(weightKg: number, bands: YanwenBand[] | undefined): YanwenBand | null {
  if (!bands?.length) return null;
  const w = weightKg;
  for (const b of bands) {
    if (b.wMin == null || b.wMax == null) continue;
    if (w >= b.wMin && w <= b.wMax) return b;
  }
  return null;
}

function isYanwenZoneMap(
  e: Yanwen484CountryEntry | undefined,
): e is Record<string, YanwenBand[]> {
  return e != null && !Array.isArray(e);
}

/** True when `yanwen484[iso2]` is a zone map (buyer must pick 1–4 for quotes). */
export function yanwenCountryUsesZones(iso2: string): boolean {
  const raw = R.yanwen484[iso2 as keyof typeof R.yanwen484] as
    | Yanwen484CountryEntry
    | undefined;
  return isYanwenZoneMap(raw);
}

/**
 * AU/CA lane digit for pricing and admin UI: **postcode first**, then stored 1–4.
 * Using `stored || postcode` caused orders to show e.g. “Lane zone 3” while
 * Cainiao priced `澳大利亚/1区` because the DB had a stale zone.
 */
export function effectiveZonedLaneDigit(
  iso2: string,
  postalCode: string | null | undefined,
  storedZone: string | null | undefined,
): string | null {
  if (!yanwenCountryUsesZones(iso2)) return null;
  const d = deriveYanwenLaneZoneDigit(iso2, (postalCode ?? "").trim());
  if (d) return d;
  const s = String(storedZone ?? "").trim();
  return /^[1-4]$/.test(s) ? s : null;
}

/** Bands for pricing: flat country, or selected zone. */
export function getYanwenBandsForQuote(
  iso2: string,
  zone: string | null | undefined,
): YanwenBand[] | undefined {
  const raw = R.yanwen484[iso2 as keyof typeof R.yanwen484] as
    | Yanwen484CountryEntry
    | undefined;
  if (!raw) return undefined;
  if (Array.isArray(raw)) return raw;
  const z = (zone ?? "").trim();
  if (!/^[1-4]$/.test(z)) return undefined;
  const bands = raw[z];
  return Array.isArray(bands) && bands.length ? bands : undefined;
}

function getYanwenBandsForMinChargeKg(
  iso2: string,
  zone: string | null | undefined,
): YanwenBand[] | undefined {
  const q = getYanwenBandsForQuote(iso2, zone);
  if (q) return q;
  if (yanwenCountryUsesZones(iso2)) return getYanwenBandsForQuote(iso2, "1");
  const raw = R.yanwen484[iso2 as keyof typeof R.yanwen484] as
    | Yanwen484CountryEntry
    | undefined;
  return Array.isArray(raw) ? raw : undefined;
}

function yanwen484InternationalCnyFromBands(
  bands: YanwenBand[] | undefined,
  billingKg: number,
): number | null {
  const b = pickYanwenBand(billingKg, bands);
  if (!b) return null;
  return Math.round((b.rmbPerKg * billingKg + b.pieceRmb) * 100) / 100;
}

/** Round weight up to the next gram (Cainiao bills per gram). */
export function roundUpKgToGram(kg: number): number {
  return Math.ceil(kg * 1000) / 1000;
}

/**
 * Country-level fees from rate-sheet 备注 (customs, VAT, etc.) — not in the weight band.
 * Pass cart/order goods in CNY for checkout; admin Fulfillment may pass
 * `declaredGoodsCnyForAdminLogisticsEstimate()` for internal low-declaration planning.
 */
export function computeDestinationFeesCny(
  iso2: string | null,
  declaredGoodsCny: number | null | undefined,
): { totalCny: number; lines: string[] } {
  if (!iso2) return { totalCny: 0, lines: [] };
  const cfg = R.countryDestinationFees?.[iso2];
  if (!cfg) return { totalCny: 0, lines: [] };

  const lines: string[] = [];
  let total = 0;

  const flat = cfg.flatCnyPerShipment ?? 0;
  if (flat > 0) {
    total += flat;
    const tag = cfg.label ? ` — ${cfg.label}` : "";
    lines.push(`Destination (remarks): flat ¥${flat.toFixed(2)}${tag}`);
  }

  const vatRate = cfg.vatRateOnDeclaredCifCny ?? 0;
  if (vatRate > 0) {
    const base = Math.max(0, Number(declaredGoodsCny) || 0);
    const vat = Math.round(base * vatRate * 100) / 100;
    total += vat;
    if (base > 0) {
      lines.push(
        `Destination (remarks): VAT ${(vatRate * 100).toFixed(0)}% on declared goods ¥${base.toFixed(2)} (CIF proxy) → ¥${vat.toFixed(2)}`,
      );
    } else {
      lines.push(
        `Destination (remarks): VAT ${(vatRate * 100).toFixed(0)}% — add order goods (CNY) to compute (currently ¥0)`,
      );
    }
  }

  return { totalCny: Math.round(total * 100) / 100, lines };
}

export type LogisticsEstimateResult = {
  iso2: string | null;
  cainiaoZhCountry: string | null;
  /** True when S5059/OH came from `cainiaoIsoFallback` (main XLSX had no row for this ISO). */
  cainiaoUsedIsoFallback: boolean;
  /** Billing kg after volumetric + gram rounding (Cainiao divisor 8000). */
  chargeableKgCainiao: number | null;
  /** Billing kg for Yanwen (divisor 18000, US 30g minimum). */
  chargeableKgYanwen: number | null;
  /** Yanwen: max(actual, volumetric) kg before applying band min-charge floor (then gram round-up). */
  yanwenPreMinChargeKg: number | null;
  /** Yanwen: embedded band min billable kg floor when present (`minChargeKg`). */
  yanwenMinChargeFloorKg: number | null;
  s5059InternationalCny: number | null;
  ohInternationalCny: number | null;
  yanwen484InternationalCny: number | null;
  yanwenWithDomesticCny: number | null;
  /** Minimum of S5059/OH — compared to Yanwen for the ±¥5 rule. */
  bestCainiaoInternationalCny: number | null;
  preferCainiao: boolean;
  /** Intl leg used for ¥50 free-ship policy (merchant cost basis). */
  policyInternationalCny: number | null;
  /** 备注 / destination-country surcharges (customs, VAT, …), CNY. */
  destinationFeesCny: number;
  /** Human-readable lines for admin (empty when no config). */
  destinationFeesLines: string[];
  freeInternational: boolean;
  buyerSupplementCny: number;
  summaryLines: string[];
};

export type LogisticsEstimateInput = {
  /** Country from checkout / order (English ISO name or 2-letter code). */
  countryLabel: string;
  /** Total watch units (qty sum). */
  totalUnits: number;
  /**
   * State/province as stored in checkout (US: ISO 3166-2 code e.g. `CA`, `UM-81`).
   * Used to exclude minor outlying islands from economy table quotes.
   */
  state?: string | null;
  /** Shipping postal / ZIP — used with country to derive AU/CA zones. */
  postalCode?: string | null;
  /**
   * Optional override when postcode lookup fails (e.g. legacy admin orders).
   * Checkout should rely on `postalCode` only.
   */
  yanwenZone?: string | null;
  /** Default single-watch weight. */
  gramsPerUnit?: number;
  /** Single-carton dimensions (cm). Volumetric uses max(actual, L×W×H divisor). */
  boxCm?: { l: number; w: number; h: number };
  /**
   * Goods value in CNY (actual subtotal × FX) for VAT-style `countryDestinationFees` when present.
   * When omitted, VAT lines in 备注 may show as ¥0 until a value is provided.
   */
  declaredGoodsCny?: number | null;
};

const DEFAULT_GRAMS = 200;
const DEFAULT_BOX = { l: 11, w: 10, h: 9 };

/**
 * Compares Cainiao S5059 + OH vs Yanwen 484 (special goods tracked).
 * Rule: prefer Cainiao if cainiaoBest ≤ yanwenIntl + 5 (domestic) + 5 (tie margin).
 * Free ship: international lane + destination 备注 fees ≤ ¥50 (combined); buyer pays the excess (CNY).
 */
export function estimateLogistics(input: LogisticsEstimateInput): LogisticsEstimateResult {
  const gramsPerUnit = input.gramsPerUnit ?? DEFAULT_GRAMS;
  const box = input.boxCm ?? DEFAULT_BOX;
  const totalUnits = Math.max(0, input.totalUnits);

  const empty: LogisticsEstimateResult = {
    iso2: null,
    cainiaoZhCountry: null,
    cainiaoUsedIsoFallback: false,
    chargeableKgCainiao: null,
    chargeableKgYanwen: null,
    yanwenPreMinChargeKg: null,
    yanwenMinChargeFloorKg: null,
    s5059InternationalCny: null,
    ohInternationalCny: null,
    yanwen484InternationalCny: null,
    yanwenWithDomesticCny: null,
    bestCainiaoInternationalCny: null,
    preferCainiao: true,
    policyInternationalCny: null,
    destinationFeesCny: 0,
    destinationFeesLines: [],
    freeInternational: true,
    buyerSupplementCny: 0,
    summaryLines: ["Add items to estimate shipping."],
  };

  if (totalUnits <= 0) {
    empty.summaryLines = ["No items — no estimate."];
    return empty;
  }

  const iso2 = countryLabelToIso2(input.countryLabel);
  if (!iso2) {
    return {
      ...empty,
      summaryLines: ["Unknown destination country — cannot estimate."],
    };
  }

  if (iso2 === "US" && isUsStateExcludedFromEconomyCarriers(input.state)) {
    return {
      ...empty,
      iso2,
      summaryLines: [
        "Cainiao / Yanwen economy lines do not apply to this U.S. minor outlying or uninhabited area — use premium express or contact us.",
      ],
    };
  }

  const pc = (input.postalCode ?? "").trim();
  const effectiveYanwenZone = yanwenCountryUsesZones(iso2)
    ? effectiveZonedLaneDigit(iso2, pc, input.yanwenZone)
    : null;

  const actualKg = (gramsPerUnit * totalUnits) / 1000;
  const volCainiao =
    (box.l * box.w * box.h) / R.cainiaoVolumetricDivisor;
  const volYanwen =
    (box.l * box.w * box.h) / R.yanwenVolumetricDivisor;
  const rawCainiao = Math.max(actualKg, volCainiao);
  const rawYanwen = Math.max(actualKg, volYanwen);

  const chargeableKgCainiao = roundUpKgToGram(rawCainiao);

  let chargeableKgYanwen = rawYanwen;
  const yBandsMin = getYanwenBandsForMinChargeKg(iso2, effectiveYanwenZone);
  const yFirst = yBandsMin?.[0];
  const yanwenMinChargeFloorKg = yFirst?.minChargeKg ?? null;
  if (yFirst?.minChargeKg != null) {
    chargeableKgYanwen = Math.max(chargeableKgYanwen, yFirst.minChargeKg);
  }
  chargeableKgYanwen = roundUpKgToGram(chargeableKgYanwen);

  const zh =
    iso2 === "MY"
      ? resolveMalaysiaCainiaoZhCountry(input.state)
      : iso2 === "PH"
        ? resolvePhilippinesCainiaoZhCountry(input.state)
      : resolveCainiaoZhCountry(iso2, effectiveYanwenZone);
  const hasMainS5059 = Boolean(zh && R.cainiao.S5059[zh]?.length);
  const hasMainOh = Boolean(zh && R.cainiao.OH[zh]?.length);
  const hasFbS5059 = Boolean(R.cainiaoIsoFallback?.[iso2]?.S5059?.length);
  const hasFbOh = Boolean(R.cainiaoIsoFallback?.[iso2]?.OH?.length);
  const cainiaoUsedIsoFallback =
    (!hasMainS5059 && hasFbS5059) || (!hasMainOh && hasFbOh);

  const s5059 = cainiaoInternationalCny(
    chargeableKgCainiao,
    iso2,
    zh,
    "S5059",
  );
  const oh = cainiaoInternationalCny(chargeableKgCainiao, iso2, zh, "OH");

  const yBandsQuote = getYanwenBandsForQuote(iso2, effectiveYanwenZone);
  const yIntl = yanwen484InternationalCnyFromBands(yBandsQuote, chargeableKgYanwen);
  const yDom = R.yanwenDomesticToWarehouseCny;
  const yWithDom = yIntl != null ? Math.round((yIntl + yDom) * 100) / 100 : null;

  const candidates = [s5059, oh].filter((x): x is number => x != null);
  const bestCainiao =
    candidates.length === 0 ? null : Math.min(...candidates);

  let preferCainiao = true;
  if (bestCainiao != null && yIntl != null && yWithDom != null) {
    const threshold = yWithDom + R.cainiaoPreferenceMarginCny;
    preferCainiao = bestCainiao <= threshold;
  } else if (bestCainiao == null && yIntl != null) {
    preferCainiao = false;
  } else if (bestCainiao != null && yIntl == null) {
    preferCainiao = true;
  }

  const policyInternationalCny = preferCainiao
    ? bestCainiao
    : (yIntl ?? bestCainiao);

  const destPack = computeDestinationFeesCny(iso2, input.declaredGoodsCny);
  const destinationFeesCny = destPack.totalCny;
  const destinationFeesLines = destPack.lines;

  let freeInternational = true;
  let buyerSupplementCny = 0;
  const intlOnly = policyInternationalCny;
  const combinedForCap =
    (intlOnly ?? 0) + destinationFeesCny;
  if (intlOnly != null || destinationFeesCny > 0) {
    buyerSupplementCny = Math.max(
      0,
      Math.round((combinedForCap - R.freeInternationalLegCny) * 100) / 100,
    );
    freeInternational = buyerSupplementCny <= 0;
  }

  const summaryLines: string[] = [];
  if (zh == null && !hasFbS5059 && !hasFbOh) {
    summaryLines.push(
      "Cainiao S5059/OH: no rate row for this destination in the embedded table.",
    );
  }
  if (cainiaoUsedIsoFallback) {
    summaryLines.push(
      "Cainiao S5059/OH: using ISO fallback bands (main XLSX had no Hong Kong row for these products).",
    );
  }
  if (yIntl == null) {
    if (yanwenCountryUsesZones(iso2) && !effectiveYanwenZone) {
      summaryLines.push(
        "Yanwen 484: could not map postal code to lane zone 1–4 (check AU/CA postcode).",
      );
    } else {
      summaryLines.push(
        "Yanwen 484: no rate row for this destination in the embedded table.",
      );
    }
  }
  if (summaryLines.length === 0) {
    const parts: string[] = [];
    parts.push(
      preferCainiao
        ? "Prefer Cainiao (≤¥5 vs Yanwen+¥5 domestic)"
        : "Yanwen cheaper beyond tie margin — compare manually",
    );
    if (policyInternationalCny != null || destinationFeesCny > 0) {
      const lane =
        policyInternationalCny != null
          ? `Lane ¥${policyInternationalCny.toFixed(1)}`
          : "Lane —";
      const destBit =
        destinationFeesCny > 0
          ? ` + destination ¥${destinationFeesCny.toFixed(2)}`
          : "";
      parts.push(
        freeInternational
          ? `${lane}${destBit} (≤¥${R.freeInternationalLegCny} combined)`
          : `${lane}${destBit} → top-up ¥${buyerSupplementCny.toFixed(2)}`,
      );
    }
    summaryLines.push(parts.join(" · "));
  }
  if (destinationFeesLines.length > 0) {
    summaryLines.push(...destinationFeesLines);
  }
  if (chargeableKgCainiao > CAINIAO_S5059_MAX_CHARGEABLE_KG + 1e-9) {
    summaryLines.push(
      `Cainiao S5059: not offered above ${CAINIAO_S5059_MAX_CHARGEABLE_KG} kg billable — use OH (or split shipments).`,
    );
  }

  return {
    iso2,
    cainiaoZhCountry: zh,
    cainiaoUsedIsoFallback,
    chargeableKgCainiao,
    chargeableKgYanwen,
    yanwenPreMinChargeKg: rawYanwen,
    yanwenMinChargeFloorKg,
    s5059InternationalCny: s5059,
    ohInternationalCny: oh,
    yanwen484InternationalCny: yIntl,
    yanwenWithDomesticCny: yWithDom,
    bestCainiaoInternationalCny: bestCainiao,
    preferCainiao,
    policyInternationalCny,
    destinationFeesCny,
    destinationFeesLines,
    freeInternational,
    buyerSupplementCny,
    summaryLines,
  };
}

/** Buyer top-up vs ¥50 int’l cap when explicitly choosing Cainiao (min S5059/OH). */
export function buyerSupplementCnyCainiao(
  est: LogisticsEstimateResult,
): number | null {
  const intl = est.bestCainiaoInternationalCny;
  if (intl == null) return null;
  const dest = est.destinationFeesCny ?? 0;
  return Math.max(
    0,
    Math.round((intl + dest - R.freeInternationalLegCny) * 100) / 100,
  );
}

/** Buyer top-up vs ¥50 cap when choosing Yanwen 484 international leg. */
export function buyerSupplementCnyYanwen(
  est: LogisticsEstimateResult,
): number | null {
  const intl = est.yanwen484InternationalCny;
  if (intl == null) return null;
  const dest = est.destinationFeesCny ?? 0;
  return Math.max(
    0,
    Math.round((intl + dest - R.freeInternationalLegCny) * 100) / 100,
  );
}

/** Whether embedded rate tables include this destination (for checkout copy). */
export function getDestinationCoverage(
  countryLabel: string,
  context?: { state?: string | null },
): {
  iso2: string | null;
  cainiao: boolean;
  yanwen: boolean;
} {
  const iso2 = countryLabelToIso2(countryLabel);
  if (!iso2) return { iso2: null, cainiao: false, yanwen: false };
  if (iso2 === "US" && isUsStateExcludedFromEconomyCarriers(context?.state)) {
    return { iso2, cainiao: false, yanwen: false };
  }
  const zh = ISO_TO_CAINIAO_ZH[iso2];
  const cainiaoAuZoned = ["1", "2", "3", "4"].some((z) => {
    const k = `澳大利亚/${z}区`;
    return (
      Boolean(R.cainiao.S5059[k]?.length) || Boolean(R.cainiao.OH[k]?.length)
    );
  });
  const cainiaoMyZoned = ["马来西亚/东马", "马来西亚/西马"].some((k) => {
    return Boolean(R.cainiao.S5059[k]?.length) || Boolean(R.cainiao.OH[k]?.length);
  });
  const cainiaoPhZoned = ["菲律宾/菲律宾马尼拉大都", "菲律宾/菲律宾其他地区"].some((k) => {
    return Boolean(R.cainiao.S5059[k]?.length) || Boolean(R.cainiao.OH[k]?.length);
  });
  const cainiao = Boolean(
    (zh &&
      (R.cainiao.S5059[zh]?.length || R.cainiao.OH[zh]?.length)) ||
      R.cainiaoIsoFallback?.[iso2]?.S5059?.length ||
      R.cainiaoIsoFallback?.[iso2]?.OH?.length ||
      (iso2 === "AU" && cainiaoAuZoned) ||
      (iso2 === "MY" && cainiaoMyZoned) ||
      (iso2 === "PH" && cainiaoPhZoned),
  );
  const raw = R.yanwen484[iso2 as keyof typeof R.yanwen484] as
    | Yanwen484CountryEntry
    | undefined;
  const yanwen = Boolean(
    raw &&
      (Array.isArray(raw)
        ? raw.length > 0
        : Object.values(raw).some((b) => Array.isArray(b) && b.length > 0)),
  );
  return { iso2, cainiao, yanwen };
}
