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
const DEFAULT_UNIT_WEIGHT_KG = 0.2;
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
  "澳大利亚-3区": [t(0.3, 55, 52), t(0.5, 55, 52), t(1, 55, 72), t(3, 59, 77), t(20, 59, 116)],
  "澳大利亚-4区": [t(0.3, 62, 55), t(0.5, 62, 55), t(1, 62, 110), t(3, 66, 120), t(20, 67, 116)],
};

const RULES: Record<string, CountryRule> = {
  US: { countryName: "美国", tiers: [t(0.1, 169, 20), t(0.2, 164, 18), t(0.45, 158, 16), t(0.7, 156, 16), t(1, 156, 9), t(3, 156, 9), t(6, 156, 9), t(30, 156, 9)] },
  CA: { countryName: "加拿大", tiers: [t(0.15, 107, 21), t(0.3, 107, 21), t(0.45, 107, 21), t(0.75, 111, 22), t(1, 111, 22), t(1.5, 111, 23), t(2, 116, 23), t(30, 118, 23)] },
  MX: { countryName: "墨西哥", tiers: [t(0.25, 100, 18), t(0.5, 100, 18), t(1, 100, 18), t(1.5, 107, 20), t(2, 107, 20), t(10, 107, 20)], surchargeRmb: () => 2.7336 },
  GB: { countryName: "英国", tiers: [t(2, 88, 18), t(20, 85, 18)] },
  DE: { countryName: "德国", tiers: [t(5, 141, 25), t(30, 146, 25)] },
  FR: { countryName: "法国", tiers: [t(3, 122, 25), t(30, 118, 25)] },
  IT: { countryName: "意大利", tiers: [t(2, 98, 25), t(10, 99, 25)] },
  ES: { countryName: "西班牙", tiers: [t(2, 111, 18), t(30, 114, 18)] },
  AT: { countryName: "奥地利", tiers: [t(3, 127, 23), t(30, 125, 23)] },
  HU: { countryName: "匈牙利", tiers: [t(30, 118, 21)] },
  SK: { countryName: "斯洛伐克", tiers: [t(30, 126, 20)] },
  SI: { countryName: "斯洛文尼亚", tiers: [t(30, 135, 24)] },
  HR: { countryName: "克罗地亚", tiers: [t(30, 142, 24)] },
  RO: { countryName: "罗马尼亚", tiers: [t(30, 114, 20)], surchargeRmb: () => 41 },
  BG: { countryName: "保加利亚", tiers: [t(30, 106, 17)] },
  RE: { countryName: "留尼汪", tiers: [t(2, 122, 69)] },
  BA: { countryName: "波斯尼亚和黑塞哥维那", tiers: [t(2, 140, 20)] },
  RS: { countryName: "塞尔维亚", tiers: [t(2, 108, 28), t(10, 113, 36), t(20, 113, 50)] },
  ME: { countryName: "黑山共和国", tiers: [t(5, 126, 17)] },
  MK: { countryName: "马其顿", tiers: [t(2, 131, 18)] },
  AL: { countryName: "阿尔巴尼亚", tiers: [t(2, 140, 26)] },
  PL: { countryName: "波兰", tiers: [t(0.3, 103, 12), t(2, 103, 13), t(20, 103, 14)] },
  CH: { countryName: "瑞士", tiers: [t(0.2, 156, 22), t(0.5, 141, 18), t(2, 131, 18)] },
  SE: { countryName: "瑞典", tiers: [t(0.3, 121, 16), t(20, 118, 21)] },
  DK: { countryName: "丹麦", tiers: [t(0.3, 143, 24), t(2, 130, 24), t(20, 121, 24)] },
  FI: { countryName: "芬兰", tiers: [t(20, 115, 26)] },
  NL: { countryName: "荷兰", tiers: [t(0.1, 130, 21), t(2, 130, 21), t(20, 128, 23)] },
  LU: { countryName: "卢森堡", tiers: [t(2, 156, 25), t(20, 161, 25)] },
  BE: { countryName: "比利时", tiers: [t(0.2, 120, 21), t(2, 120, 21), t(20, 118, 23)] },
  MT: { countryName: "马耳他", tiers: [t(2, 181, 30)] },
  GR: { countryName: "希腊", tiers: [t(2, 114, 17), t(20, 114, 17)] },
  CZ: { countryName: "捷克", tiers: [t(2, 99, 20), t(30, 104, 20)] },
  CY: { countryName: "塞浦路斯", tiers: [t(2, 149, 27), t(20, 149, 27)] },
  UA: { countryName: "乌克兰", tiers: [t(0.2, 115, 12), t(2, 115, 12), t(20, 115, 12)] },
  LT: { countryName: "立陶宛", tiers: [t(5, 110, 20)] },
  EE: { countryName: "爱沙尼亚", tiers: [t(5, 108, 20)] },
  LV: { countryName: "拉脱维亚", tiers: [t(5, 110, 20)] },
  IE: { countryName: "爱尔兰", tiers: [t(20, 142, 23)] },
  PT: { countryName: "葡萄牙", tiers: [t(2, 130, 19), t(30, 132, 19)] },
  RU: { countryName: "俄罗斯", tiers: [t(0.5, 47, 18), t(1, 47, 18), t(1.5, 47, 18), t(2, 47, 18), t(5, 47, 18)] },
  MD: { countryName: "摩尔多瓦", tiers: [t(0.15, 74, 15), t(0.3, 74, 15), t(0.5, 74, 15), t(1, 74, 15), t(2, 74, 15), t(20, 79, 50)] },
  IS: { countryName: "冰岛", tiers: [t(5, 143, 38), t(10, 143, 58), t(20, 143, 78)] },
  NO: { countryName: "挪威", tiers: [t(0.1, 133, 21), t(0.3, 118, 20), t(5, 113, 20)] },
  AU: { countryName: "澳大利亚", zoneAware: true, zoneMap: AU_ZONE_RATES },
  NZ: { countryName: "新西兰", tiers: [t(0.5, 99, 16), t(2, 99, 16), t(25, 92, 16)], surchargeRmb: () => 10 },
  PE: { countryName: "秘鲁", tiers: [t(0.25, 175, 30), t(0.5, 175, 21), t(1, 175, 21), t(2, 175, 21)] },
  CO: { countryName: "哥伦比亚", tiers: [t(0.5, 124, 24), t(2, 128, 24), t(5, 130, 24)] },
  BR: { countryName: "巴西", tiers: [t(0.2, 86, 35), t(0.5, 86, 35), t(1, 86, 40), t(1.5, 86, 46), t(2, 86, 52), t(2.5, 89, 55), t(30, 93, 60)] },
  EC: { countryName: "厄瓜多尔", tiers: [t(0.5, 245, 25), t(1, 245, 25), t(2, 245, 25)] },
  CL: { countryName: "智利", tiers: [t(0.5, 90, 23), t(1, 90, 25), t(1.5, 90, 30), t(2, 90, 35), t(5, 90, 50), t(10, 90, 90), t(15, 90, 130)], surchargeRmb: ({ baseFreightRmb }) => ((1.2 * 1.02 * 6.8) + baseFreightRmb) * 0.19 },
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
  TT: { countryName: "特立尼达和多巴哥", tiers: [t(2, 230, 46)] },
  SG: { countryName: "新加坡", tiers: [t(0.5, 46, 15), t(1, 46, 15), t(1.5, 46, 15), t(2, 46, 15), t(20, 46, 15)] },
  MY: { countryName: "马来西亚（东马）", tiers: [t(0.5, 40, 16), t(1, 40, 16), t(1.5, 45, 16), t(2, 45, 16), t(20, 45, 16)] },
  PH: { countryName: "菲律宾（菲律宾其他地区）", tiers: [t(0.5, 50, 10), t(1, 50, 13), t(1.5, 52, 49), t(2, 52, 49), t(20, 52, 50)] },
  TH: { countryName: "泰国", tiers: [t(0.5, 28, 7), t(1, 28, 7), t(1.5, 28, 7), t(2, 28, 7), t(20, 28, 7)] },
  VN: { countryName: "越南", tiers: [t(0.5, 27, 9), t(1, 27, 9), t(1.5, 27, 9), t(2, 27, 9), t(20, 27, 9)] },
  KR: { countryName: "韩国", tiers: [t(2, 8, 23.5), t(5, 8, 23.5), t(10, 9, 23.5), t(20, 10, 23.5), t(30, 15, 23.5)] },
  MN: { countryName: "蒙古", tiers: [t(0.5, 27, 18), t(1, 27, 18), t(1.5, 27, 18), t(2, 27, 18), t(20, 27, 18)] },
  LK: { countryName: "斯里兰卡", tiers: [t(0.5, 67, 7), t(1, 67, 8), t(1.5, 67, 10), t(2, 67, 12), t(20, 67, 15)] },
  IL: { countryName: "以色列", tiers: [t(2, 176, 21), t(3, 192, 26), t(5, 192, 30), t(10, 192, 60)] },
  SA: { countryName: "沙特阿拉伯", tiers: [t(0.5, 91, 36), t(2, 91, 36), t(5, 93, 36), t(30, 93, 36)], surchargeRmb: () => (1.2 * 0.15 * 6.8) + 33.35 },
  AE: { countryName: "阿联酋", tiers: [t(0.5, 75, 20), t(2, 75, 20), t(5, 75, 20), t(30, 84, 20)], surchargeRmb: () => 1.2 * 0.05 * 6.8 },
  QA: { countryName: "卡塔尔", tiers: [t(0.5, 76, 45), t(2, 76, 45), t(5, 76, 45), t(20, 76, 45)], surchargeRmb: () => 40 },
  KW: { countryName: "科威特", tiers: [t(0.5, 80, 40), t(2, 80, 40), t(5, 80, 40), t(20, 80, 40)], surchargeRmb: () => (1.2 * 0.05 * 6.8) + 35 },
  BH: { countryName: "巴林", tiers: [t(0.5, 77, 40), t(2, 77, 40), t(5, 77, 40), t(20, 77, 40)], surchargeRmb: () => 1.2 * 0.1 * 6.8 },
  OM: { countryName: "阿曼", tiers: [t(0.5, 88, 38), t(2, 88, 38), t(5, 88, 38), t(20, 88, 38)], surchargeRmb: () => (1.2 * 0.05 * 6.8) + 20 },
  IQ: { countryName: "伊拉克", tiers: [t(2, 110, 30), t(5, 112, 30), t(30, 122, 30)] },
  NG: { countryName: "尼日利亚", tiers: [t(30, 118, 24)] },
  GH: { countryName: "加纳", tiers: [t(30, 165, 22)] },
  UG: { countryName: "乌干达", tiers: [t(30, 152, 22)] },
  KE: { countryName: "肯尼亚", tiers: [t(30, 113, 22)] },
  MA: { countryName: "摩洛哥", tiers: [t(5, 100, 47)], surchargeRmb: () => 1.2 * 0.56 * 6.8 },
  TZ: { countryName: "坦桑尼亚", tiers: [t(2, 118, 18)] },
  RW: { countryName: "卢旺达", tiers: [t(2, 135, 18)] },
  AO: { countryName: "安哥拉", tiers: [t(2, 149, 23)] },
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
