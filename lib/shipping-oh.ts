import { findPostalZone } from "@/lib/global-postal-zones";

export type ShippingOhInput = {
  countryCode: string;
  postalCode?: string;
  weightKg?: number;
  quantity?: number;
};

type Tier = {
  maxWeightKg: number;
  freightRmbPerKg: number;
  registrationFeeRmb: number;
  note?: string;
};

type CountryRule = {
  countryName: string;
  tiers?: Tier[];
  surchargeRmb?: (ctx: { baseFreightRmb: number; billableWeightKg: number }) => number;
  zoneAware?: boolean;
  zoneMap?: Record<string, Tier[]>;
  calculator?: (billableWeightKg: number) => { freightRmbPerKg: number; registrationFeeRmb: number; baseFreightRmb: number } | null;
};

export type ShippingOhQuote = {
  carrier: "Cainiao";
  service: "OH";
  countryCode: string;
  countryName: string;
  zone?: string;
  billableWeightKg: number;
  freightRmbPerKg: number;
  registrationFeeRmb: number;
  surchargeRmb: number;
  baseFreightRmb: number;
  checkoutPriceRmb: number;
  checkoutDisplay: string;
  currency: "RMB";
};

const CHECKOUT_DISCOUNT_RMB = 50;
const DEFAULT_UNIT_WEIGHT_KG = 0.3;
const RMB_PER_USD = 6.8;

const t = (maxWeightKg: number, freightRmbPerKg: number, registrationFeeRmb: number, note?: string): Tier => ({
  maxWeightKg,
  freightRmbPerKg,
  registrationFeeRmb,
  note,
});

const AU_ZONE_RATES: Record<string, Tier[]> = {
  "澳大利亚-1区": [t(0.3, 55, 21), t(0.5, 55, 24), t(1, 55, 25), t(3, 59, 27), t(20, 59, 42)],
  "澳大利亚-2区": [t(0.3, 55, 29), t(0.5, 55, 30), t(1, 55, 34), t(3, 59, 36), t(20, 59, 53)],
  "澳大利亚-3区": [t(0.3, 55, 55), t(0.5, 55, 56), t(1, 55, 78), t(3, 59, 81), t(20, 59, 120)],
  "澳大利亚-4区": [t(0.3, 62, 65), t(0.5, 62, 65), t(1, 62, 120), t(3, 66, 130), t(20, 81, 126)],
};

const RULES: Record<string, CountryRule> = {
  US: { countryName: "美国", tiers: [t(0.1, 153, 20), t(0.2, 148, 18), t(0.45, 142, 16), t(0.7, 140, 16), t(1, 140, 9), t(3, 140, 9), t(6, 140, 9), t(30, 140, 9)] },
  CA: { countryName: "加拿大", tiers: [t(0.15, 92, 21), t(0.3, 92, 21), t(0.45, 92, 21), t(0.75, 101, 22), t(1, 101, 22), t(1.5, 101, 23), t(2, 109, 23), t(30, 109, 23)] },
  MX: { countryName: "墨西哥", tiers: [t(0.25, 92, 18), t(0.5, 92, 18), t(1, 92, 18), t(1.5, 99, 20), t(2, 99, 20), t(10, 99, 20)], surchargeRmb: () => 2.7336 },
  GB: { countryName: "英国", tiers: [t(2, 86, 18), t(20, 83, 18)] },
  DE: { countryName: "德国", tiers: [t(0.3, 124, 27), t(2, 124, 27), t(5, 124, 27), t(30, 129, 27)] },
  FR: { countryName: "法国", tiers: [t(3, 103, 25), t(30, 99, 25)] },
  IT: { countryName: "意大利", tiers: [t(2, 88, 25), t(10, 89, 25)] },
  ES: { countryName: "西班牙", tiers: [t(2, 103, 18), t(30, 106, 18)] },
  AT: { countryName: "奥地利", tiers: [t(3, 118, 23), t(30, 116, 23)] },
  HU: { countryName: "匈牙利", tiers: [t(30, 112, 21)] },
  SI: { countryName: "斯洛文尼亚", tiers: [t(30, 129, 24)] },
  HR: { countryName: "克罗地亚", tiers: [t(30, 136, 24)] },
  RO: { countryName: "罗马尼亚", tiers: [t(30, 109, 20)], surchargeRmb: () => 41 },
  BG: { countryName: "保加利亚", tiers: [t(30, 95, 17)] },
  AL: { countryName: "阿尔巴尼亚", tiers: [t(2, 140, 26)] },
  PL: { countryName: "波兰", tiers: [t(0.3, 97, 12), t(2, 97, 13), t(20, 97, 14)] },
  CH: { countryName: "瑞士", tiers: [t(0.2, 153, 22), t(0.5, 138, 18), t(5, 128, 18)] },
  SE: { countryName: "瑞典", tiers: [t(0.3, 112, 16), t(2, 109, 21), t(20, 109, 21)] },
  DK: { countryName: "丹麦", tiers: [t(0.3, 134, 24), t(2, 121, 24), t(20, 112, 24)] },
  FI: { countryName: "芬兰", tiers: [t(20, 114, 26)] },
  NL: { countryName: "荷兰", tiers: [t(0.2, 119, 21), t(2, 119, 23), t(20, 117, 23)] },
  LU: { countryName: "卢森堡", tiers: [t(2, 149, 25), t(20, 154, 25)] },
  BE: { countryName: "比利时", tiers: [t(0.2, 110, 21), t(2, 110, 21), t(20, 108, 23)] },
  MT: { countryName: "马耳他", tiers: [t(2, 178, 30)] },
  GR: { countryName: "希腊", tiers: [t(2, 101, 17), t(20, 101, 17)] },
  CY: { countryName: "塞浦路斯", tiers: [t(2, 136, 27), t(20, 136, 27)] },
  UA: { countryName: "乌克兰", tiers: [t(0.2, 110, 12), t(2, 110, 12), t(20, 110, 12)] },
  LT: { countryName: "立陶宛", tiers: [t(5, 109, 20)] },
  EE: { countryName: "爱沙尼亚", tiers: [t(5, 107, 20)] },
  LV: { countryName: "拉脱维亚", tiers: [t(5, 109, 20)] },
  IE: { countryName: "爱尔兰", tiers: [t(20, 112, 23)] },
  PT: { countryName: "葡萄牙", tiers: [t(2, 118, 19), t(30, 120, 19)] },
  RU: { countryName: "俄罗斯", tiers: [t(0.5, 40, 16), t(1, 40, 16), t(1.5, 40, 16), t(2, 40, 16), t(5, 40, 16)] },
  MD: { countryName: "摩尔多瓦", tiers: [t(0.15, 74, 15), t(0.3, 74, 15), t(0.5, 74, 15), t(1, 74, 15), t(2, 74, 15), t(20, 79, 50)] },
  IS: { countryName: "冰岛", tiers: [t(5, 147, 38), t(10, 147, 58), t(20, 147, 78)] },
  AU: { countryName: "澳大利亚", zoneAware: true, zoneMap: AU_ZONE_RATES },
  NZ: { countryName: "新西兰", tiers: [t(0.5, 99, 16), t(2, 99, 16), t(25, 92, 16)], surchargeRmb: () => 10 },
  PE: { countryName: "秘鲁", tiers: [t(0.25, 175, 30), t(0.5, 175, 21), t(1, 175, 21), t(2, 175, 21)] },
  CO: { countryName: "哥伦比亚", tiers: [t(0.5, 124, 24), t(2, 128, 24), t(5, 130, 24)] },
  BR: { countryName: "巴西", tiers: [t(0.2, 86, 35), t(0.5, 86, 35), t(1, 86, 40), t(1.5, 86, 46), t(2, 86, 52), t(2.5, 89, 55), t(3, 89, 58), t(3.5, 89, 62), t(4, 89, 66), t(4.5, 89, 71), t(5, 89, 75), t(30, 93, 78)] },
  EC: { countryName: "厄瓜多尔", tiers: [t(0.5, 245, 25), t(1, 245, 25), t(2, 245, 25)] },
  CL: { countryName: "智利", tiers: [t(0.5, 87, 20), t(1, 87, 22), t(1.5, 87, 27), t(2, 87, 32), t(5, 87, 47), t(10, 87, 87), t(15, 87, 127)], surchargeRmb: ({ baseFreightRmb }) => ((1.2 * 1.02 * 6.8) + baseFreightRmb) * 0.19 },
  UY: { countryName: "乌拉圭", tiers: [t(2, 245, 24)] },
  PY: { countryName: "巴拉圭", tiers: [t(2, 240, 24)] },
  HN: { countryName: "洪都拉斯", tiers: [t(2, 211, 22)] },
  NI: { countryName: "尼加拉瓜", tiers: [t(2, 208, 22)] },
  BO: { countryName: "玻利维亚", tiers: [t(2, 248, 24)] },
  SV: { countryName: "萨尔瓦多", tiers: [t(2, 203, 22)] },
  CR: { countryName: "哥斯达黎加", tiers: [t(2, 193, 24)] },
  GT: { countryName: "危地马拉", tiers: [t(2, 127, 40)] },
  PA: { countryName: "巴拿马", tiers: [t(2, 230, 41)] },
  DO: { countryName: "多米尼加共和国", tiers: [t(2, 212, 22)] },
  SG: { countryName: "新加坡", tiers: [t(0.5, 46, 15), t(1, 46, 15), t(1.5, 46, 15), t(2, 46, 15), t(20, 46, 15)] },
  PH: { countryName: "菲律宾（菲律宾其他地区）", tiers: [t(0.5, 50, 10), t(1, 50, 13), t(1.5, 52, 13), t(2, 52, 13), t(20, 52, 50)] },
  TH: { countryName: "泰国", tiers: [t(0.5, 29, 7), t(1, 29, 7), t(1.5, 29, 7), t(2, 29, 7), t(20, 29, 7)] },
  VN: { countryName: "越南", tiers: [t(0.5, 28, 9), t(1, 28, 9), t(1.5, 28, 9), t(2, 28, 9), t(20, 28, 9)] },
  KR: { countryName: "韩国", tiers: [t(2, 7, 16), t(5, 8, 17), t(10, 8, 17), t(20, 8, 17)] },
  LK: { countryName: "斯里兰卡", tiers: [t(0.5, 67, 7), t(1, 67, 8), t(1.5, 67, 10), t(2, 67, 12), t(20, 67, 15)] },
  IL: { countryName: "以色列", tiers: [t(2, 138, 21), t(3, 154, 26), t(5, 154, 30), t(10, 154, 60)] },
  SA: { countryName: "沙特阿拉伯", tiers: [t(0.5, 85, 36), t(2, 85, 36), t(5, 86, 36), t(30, 86, 36)], surchargeRmb: () => (1.2 * 0.15 * 6.8) + 33.35 },
  QA: { countryName: "卡塔尔", tiers: [t(0.5, 76, 45), t(2, 76, 45), t(5, 76, 45), t(20, 76, 45)], surchargeRmb: () => 40 },
  KW: { countryName: "科威特", tiers: [t(0.5, 80, 40), t(2, 80, 40), t(5, 80, 40), t(20, 80, 40)], surchargeRmb: () => (1.2 * 0.05 * 6.8) + 35 },
  BH: { countryName: "巴林", tiers: [t(0.5, 77, 40), t(2, 77, 40), t(5, 77, 40), t(20, 77, 40)], surchargeRmb: () => 1.2 * 0.1 * 6.8 },
  OM: { countryName: "阿曼", tiers: [t(0.5, 88, 38), t(2, 88, 38), t(5, 88, 38), t(20, 88, 38)], surchargeRmb: () => (1.2 * 0.05 * 6.8) + 20 },
  IQ: { countryName: "伊拉克", tiers: [t(2, 135, 30), t(5, 137, 30), t(30, 147, 30)] },
  NG: { countryName: "尼日利亚", tiers: [t(30, 129, 22)] },
  GH: { countryName: "加纳", tiers: [t(30, 181, 22)] },
  UG: { countryName: "乌干达", tiers: [t(30, 169, 22)] },
  KE: { countryName: "肯尼亚", tiers: [t(30, 171, 22)] },
  MA: { countryName: "摩洛哥", tiers: [t(5, 122, 50)], surchargeRmb: () => 1.2 * 0.56 * 6.8 },
  TZ: { countryName: "坦桑尼亚", tiers: [t(2, 129, 18)] },
  RW: { countryName: "卢旺达", tiers: [t(2, 138, 18)] },
  AO: { countryName: "安哥拉", tiers: [t(2, 154, 23)] },
  AE: { countryName: "阿联酋", tiers: [t(0.5, 75, 20), t(2, 75, 20), t(5, 75, 20), t(30, 84, 20)], surchargeRmb: () => 1.2 * 0.05 * 6.8 },
  BA: { countryName: "波斯尼亚和黑塞哥维那", tiers: [t(2, 140, 20)] },
  CZ: { countryName: "捷克", tiers: [t(2, 99, 20), t(30, 104, 20)] },
  ME: { countryName: "黑山共和国", tiers: [t(5, 126, 17)] },
  MK: { countryName: "马其顿", tiers: [t(2, 131, 18)] },
  MN: { countryName: "蒙古", tiers: [t(0.5, 27, 18), t(1, 27, 18), t(1.5, 27, 18), t(2, 27, 18), t(20, 27, 18)] },
  MY: { countryName: "马来西亚（东马）", tiers: [t(0.5, 40, 16), t(1, 40, 16), t(1.5, 45, 16), t(2, 45, 16), t(20, 45, 16)] },
  NO: { countryName: "挪威", tiers: [t(0.1, 133, 21), t(0.3, 118, 20), t(5, 113, 20)] },
  RE: { countryName: "留尼汪", tiers: [t(2, 122, 69)] },
  RS: { countryName: "塞尔维亚", tiers: [t(2, 108, 28), t(10, 113, 36), t(20, 113, 50)] },
  SK: { countryName: "斯洛伐克", tiers: [t(30, 126, 20)] },
  TT: { countryName: "特立尼达和多巴哥", tiers: [t(2, 230, 46)] },
  MU: { countryName: "毛里求斯", tiers: [t(2, 125, 22)] },
  MG: { countryName: "马达加斯加", tiers: [t(2, 145, 68)] },
  ZM: { countryName: "赞比亚", tiers: [t(2, 130, 45)] },
  DZ: { countryName: "阿尔及利亚", tiers: [t(0.5, 147, 30), t(2, 147, 38), t(5, 147, 47), t(10, 147, 65), t(30, 147, 87)] },
  JP: {
    countryName: "日本",
    calculator: (billableWeightKg) => {
      if (billableWeightKg <= 0.5) {
        return { freightRmbPerKg: 0, registrationFeeRmb: 34, baseFreightRmb: 34 };
      }
      if (billableWeightKg <= 2) {
        const extraUnits = Math.ceil((billableWeightKg - 0.5) / 0.5);
        const baseFreightRmb = 34 + extraUnits * 9;
        return { freightRmbPerKg: 9, registrationFeeRmb: 34, baseFreightRmb };
      }
      const extraUnits = Math.ceil((billableWeightKg - 2) / 0.5);
      const baseFreightRmb = 34 + 27 + extraUnits * 12;
      return { freightRmbPerKg: 12, registrationFeeRmb: 34, baseFreightRmb };
    },
  },
  KZ: {
    countryName: "哈萨克斯坦",
    calculator: (billableWeightKg) => {
      if (billableWeightKg <= 0.1) {
        return { freightRmbPerKg: 0, registrationFeeRmb: 6, baseFreightRmb: 6 };
      }
      const extraUnits = Math.ceil((billableWeightKg - 0.1) / 0.1);
      const baseFreightRmb = 6 + extraUnits * 3.5;
      return { freightRmbPerKg: 3.5, registrationFeeRmb: 6, baseFreightRmb };
    },
  },
  AR: { countryName: "阿根廷", tiers: [t(2, 116, 42), t(7, 116, 62), t(15, 116, 92)] },
  ZA: { countryName: "南非", tiers: [t(2, 95, 29), t(30, 95, 29)] },
};

function normalizeCountryCode(value: string): string {
  const v = value.trim().toUpperCase();
  return v.includes("/") ? v.split("/")[0] : v;
}

function getBillableWeightKg(input: ShippingOhInput): number {
  const quantity = Math.max(1, Math.floor(input.quantity ?? 1));
  const actualWeightKg = Math.max(0, input.weightKg ?? 0);
  const defaultWeightKg = quantity * DEFAULT_UNIT_WEIGHT_KG;
  return Math.max(actualWeightKg, defaultWeightKg);
}

function pickTier(tiers: Tier[], billableWeightKg: number): Tier | null {
  return tiers.find((tier) => billableWeightKg > 0 && billableWeightKg <= tier.maxWeightKg) ?? null;
}

function getZoneTier(countryCode: string, postalCode?: string): Tier[] {
  if (!postalCode) return AU_ZONE_RATES["澳大利亚-3区"];
  const match = findPostalZone(countryCode, postalCode);
  return (match?.zone && AU_ZONE_RATES[match.zone]) ? AU_ZONE_RATES[match.zone] : AU_ZONE_RATES["澳大利亚-3区"];
}

export function getShippingOhQuote(input: ShippingOhInput): ShippingOhQuote | null {
  const countryCode = normalizeCountryCode(input.countryCode);
  const rule = RULES[countryCode];
  if (!rule) return null;

  const billableWeightKg = getBillableWeightKg(input);

  let freightRmbPerKg = 0;
  let registrationFeeRmb = 0;
  let baseFreightRmb = 0;
  let zone: string | undefined;

  if (rule.calculator) {
    const calculated = rule.calculator(billableWeightKg);
    if (!calculated) return null;
    freightRmbPerKg = calculated.freightRmbPerKg;
    registrationFeeRmb = calculated.registrationFeeRmb;
    baseFreightRmb = calculated.baseFreightRmb;
  } else {
    const tiers = countryCode === "AU" ? getZoneTier(countryCode, input.postalCode) : rule.tiers;
    if (!tiers) return null;
    const tier = pickTier(tiers, billableWeightKg);
    if (!tier) return null;
    freightRmbPerKg = tier.freightRmbPerKg;
    registrationFeeRmb = tier.registrationFeeRmb;
    baseFreightRmb = billableWeightKg * tier.freightRmbPerKg + tier.registrationFeeRmb;
    if (countryCode === "AU") {
      zone = findPostalZone(countryCode, input.postalCode ?? "")?.zone ?? "澳大利亚-3区";
    }
  }

  const surchargeRmb = rule.surchargeRmb?.({ baseFreightRmb, billableWeightKg }) ?? 0;
  const checkoutPriceRmb = baseFreightRmb + surchargeRmb - CHECKOUT_DISCOUNT_RMB;
  const checkoutDisplay = checkoutPriceRmb <= 0
    ? "Free Shipping"
    : `Shipping Fee $${(checkoutPriceRmb / RMB_PER_USD).toFixed(2)}`;

  return {
    carrier: "Cainiao",
    service: "OH",
    countryCode,
    countryName: rule.countryName,
    zone,
    billableWeightKg,
    freightRmbPerKg,
    registrationFeeRmb,
    surchargeRmb,
    baseFreightRmb,
    checkoutPriceRmb,
    checkoutDisplay,
    currency: "RMB",
  };
}

/** ISO2 codes that use first-weight + additional-weight (not ¥/kg × W). */
export function isShippingOhFirstExtraCountry(countryCode: string): boolean {
  const code = normalizeCountryCode(countryCode);
  return Boolean(RULES[code]?.calculator);
}

/**
 * Carrier OH freight for Standard checkout (no retail -50 discount).
 * Returns null when OH has no rule for the country.
 */
export function getOhStandardShippingCny(input: ShippingOhInput): number | null {
  const q = getShippingOhQuote(input);
  if (!q) return null;
  const total = q.baseFreightRmb + q.surchargeRmb;
  return Math.round(total * 100) / 100;
}

