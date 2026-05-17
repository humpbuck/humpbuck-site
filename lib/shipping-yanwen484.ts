import { findPostalZone } from '@/lib/global-postal-zones';

export type ShippingYanwen484Input = {
  countryCode: string;
  postalCode?: string;
  weightKg?: number;
  quantity?: number;
};

export type ShippingYanwen484Quote = {
  carrier: 'Yanwen';
  service: '484';
  countryCode: string;
  countryName: string;
  zone?: string;
  billableWeightKg: number;
  freightRmbPerKg: number;
  processingFeeRmb: number;
  surchargeRmb: number;
  baseFreightRmb: number;
  checkoutPriceRmb: number;
  currency: 'RMB';
};

type Tier = { maxWeightKg: number; freightRmbPerKg: number; processingFeeRmb: number };
type CountryRule = {
  countryName: string;
  tiers?: Tier[];
  surchargeRmb?: (baseFreightRmb: number, billableWeightKg: number) => number;
  zoneAware?: boolean;
  zoneMap?: Record<string, Tier[]>;
};

type CountryRuleSet = CountryRule | CountryRule[];

const DEFAULT_PRODUCT_WEIGHT_KG = 0.2;
const DOMESTIC_TRANSPORT_FEE_RMB = 5;
const CHECKOUT_DISCOUNT_RMB = 50;
const t = (maxWeightKg: number, freightRmbPerKg: number, processingFeeRmb: number): Tier => ({ maxWeightKg, freightRmbPerKg, processingFeeRmb });

const RULES: Record<string, CountryRuleSet> = {
  US: { countryName: 'United States', tiers: [t(0.1, 149, 20), t(0.2, 143, 18), t(0.45, 139, 16), t(0.7, 132, 16), t(1.5, 132, 9), t(2, 132, 9), t(30, 125, 9)] },
  MX: { countryName: 'Mexico', tiers: [t(0.5, 101, 18), t(1, 103, 19), t(5, 106, 20), t(10, 106, 20)], surchargeRmb: () => 1.2 * 33.5 / 100 * 6.8 },
  PR: { countryName: 'Puerto Rico', tiers: [t(0.2, 134, 32), t(0.34, 134, 35), t(0.45, 134, 35), t(0.7, 139, 45), t(1, 139, 45), t(30, 139, 55)] },
  RA: { countryName: 'United States Remote Area', tiers: [t(0.2, 134, 32), t(0.34, 134, 35), t(0.45, 134, 35), t(0.7, 139, 45), t(1, 139, 45), t(30, 139, 55)] },
  FR: { countryName: 'France', tiers: [t(0.5, 113, 20), t(30, 111, 23)] },
  DE: { countryName: 'Germany', tiers: [t(0.1, 115, 22), t(0.3, 115, 21), t(30, 118, 22)] },
  IT: { countryName: 'Italy', tiers: [t(2, 101, 25), t(30, 103, 25)] },
  ES: { countryName: 'Spain', tiers: [t(2, 114, 18), t(30, 117, 18)] },
  NL: { countryName: 'Netherlands', tiers: [t(0.1, 142, 23), t(0.2, 135, 23), t(2, 132, 23), t(30, 134, 23)] },
  AT: { countryName: 'Austria', tiers: [t(2, 135, 23), t(30, 135, 23)] },
  BE: { countryName: 'Belgium', tiers: [t(0.2, 128, 23), t(2, 128, 21), t(30, 124, 21)] },
  BG: { countryName: 'Bulgaria', tiers: [t(2, 111, 17), t(30, 111, 17)] },
  CH: { countryName: 'Switzerland', tiers: [t(0.2, 123, 24), t(0.5, 128, 24), t(1, 138, 24), t(2, 138, 24), t(30, 138, 34)] },
  CY: { countryName: 'Cyprus', tiers: [t(0.2, 162, 29), t(20, 162, 29)] },
  CZ: { countryName: 'Czech Republic', tiers: [t(2, 114, 20), t(30, 120, 20)] },
  DK: { countryName: 'Denmark', tiers: [t(0.3, 147, 24), t(2, 131, 24), t(20, 122, 24)] },
  EE: { countryName: 'Estonia', tiers: [t(2, 117, 20), t(30, 121, 20)] },
  FI: { countryName: 'Finland', tiers: [t(20, 120, 26)] },
  GR: { countryName: 'Greece', tiers: [t(30, 120, 18)] },
  HR: { countryName: 'Croatia', tiers: [t(30, 160, 24)] },
  HU: { countryName: 'Hungary', tiers: [t(2, 133, 21), t(30, 137, 21)] },
  IE: { countryName: 'Ireland', tiers: [t(20, 142, 23)] },
  LT: { countryName: 'Lithuania', tiers: [t(2, 118, 20), t(30, 121, 20)] },
  LU: { countryName: 'Luxembourg', tiers: [t(0.2, 163, 29), t(2, 160, 26), t(30, 158, 26)] },
  LV: { countryName: 'Latvia', tiers: [t(2, 122, 20), t(30, 123, 20)] },
  MT: { countryName: 'Malta', tiers: [t(20, 189, 30)] },
  NO: { countryName: 'Norway', tiers: [t(0.1, 139, 20), t(0.3, 124, 20), t(5, 119, 20)] },
  PL: { countryName: 'Poland', tiers: [t(0.2, 114, 13), t(30, 116, 15)] },
  PT: { countryName: 'Portugal', tiers: [t(2, 132, 20), t(30, 135, 20)] },
  RO: { countryName: 'Romania', tiers: [t(2, 118, 20), t(30, 118, 20)], surchargeRmb: () => 1.2 * 21 / 100 * 6.8 + 41 },
  SE: { countryName: 'Sweden', tiers: [t(0.3, 122, 16), t(2, 119, 21), t(20, 119, 21)] },
  SI: { countryName: 'Slovenia', tiers: [t(30, 151, 24)] },
  SK: { countryName: 'Slovakia', tiers: [t(2, 135, 20), t(30, 138, 20)] },
  UA: { countryName: 'Ukraine', tiers: [t(0.15, 134, 20), t(30, 119, 12)] },
  BR: { countryName: 'Brazil', tiers: [t(0.5, 105, 45), t(1, 105, 46), t(1.5, 105, 48), t(2, 105, 52.5), t(3, 105, 69), t(5, 105, 79)] },
  AR: { countryName: 'Argentina', tiers: [t(0.25, 140, 75), t(0.5, 140, 80), t(1, 140, 92), t(2, 140, 110)], surchargeRmb: () => 1.2 * 21 / 100 * 6.8 },
  CL: { countryName: 'Chile', tiers: [t(0.5, 97, 23), t(1, 110, 25), t(5, 110, 27)], surchargeRmb: () => 1.2 * 19 / 100 * 6.8 },
  CO: { countryName: 'Colombia', tiers: [t(2, 134, 26), t(3, 134, 26)] },
  PE: { countryName: 'Peru', tiers: [t(2, 185, 21)] },
  NZ: { countryName: 'New Zealand', tiers: [t(25, 98, 26)] },
  HK: { countryName: 'Hong Kong', tiers: [t(2, 15, 22), t(20, 15, 40)] },
  IN: { countryName: 'India', tiers: [t(30, 118, 13)] },
  KR: { countryName: 'South Korea', tiers: [t(2, 6, 17), t(20, 8, 17)] },
  MY: { countryName: 'Malaysia', tiers: [t(1, 32.5, 21), t(30, 35.5, 16)] },
  PH: { countryName: 'Philippines', tiers: [t(0.5, 92, 12), t(10, 88, 12), t(30, 88, 11)] },
  SG: { countryName: 'Singapore', tiers: [t(30, 45, 16)] },
  TH: { countryName: 'Thailand', tiers: [t(30, 50, 25)] },
  AE: { countryName: 'United Arab Emirates', tiers: [t(1, 75, 22), t(5, 75, 22), t(30, 75, 24)], surchargeRmb: () => 1.2 * 5 / 100 * 6.8 },
  BH: { countryName: 'Bahrain', tiers: [t(0.3, 64, 37), t(0.5, 75, 40), t(1.5, 95, 55), t(5, 110, 65)] },
  JO: { countryName: 'Jordan', tiers: [t(0.5, 120, 37), t(2, 120, 30), t(5, 118, 25), t(15, 118, 25)], surchargeRmb: () => 53 },
  OM: { countryName: 'Oman', tiers: [t(20, 103, 37)], surchargeRmb: () => 1.2 * 5 / 100 * 6.8 + 25 },
  QA: { countryName: 'Qatar', tiers: [t(0.5, 75, 45), t(2, 80, 45), t(5, 95, 55), t(30, 95, 55)], surchargeRmb: () => 50 },
  SA: { countryName: 'Saudi Arabia', tiers: [t(0.5, 83, 40), t(1, 84, 35), t(2, 84, 35), t(5, 84, 35), t(30, 84, 25)], surchargeRmb: () => 1.2 * 15 / 100 * 6.8 + 34 },
  VN: { countryName: 'Vietnam', tiers: [t(30, 31, 11)] },
  AO: { countryName: 'Angola', tiers: [t(2, 180, 24)], surchargeRmb: () => 1.2 * 16 / 100 * 6.8 },
  GH: { countryName: 'Ghana', tiers: [t(2, 170, 22), t(10, 260, 22), t(30, 230, 22)] },
  KE: { countryName: 'Kenya', tiers: [t(2, 135, 22), t(10, 190, 22), t(30, 170, 22)] },
  MA: { countryName: 'Morocco', tiers: [t(2, 130, 48)], surchargeRmb: () => 5 * 52 / 100 * 6.8 },
  NG: { countryName: 'Nigeria', tiers: [t(2, 140, 27), t(10, 195, 27), t(30, 175, 27)] },
  RW: { countryName: 'Rwanda', tiers: [t(2, 155, 18)] },
  TZ: { countryName: 'Tanzania', tiers: [t(2, 125, 21)] },
  UG: { countryName: 'Uganda', tiers: [t(2, 160, 22), t(10, 250, 22), t(30, 220, 22)] },
  ZA: { countryName: 'South Africa', tiers: [t(8, 171, 28)] },
  JP: { countryName: 'Japan', tiers: [t(2, 34, 0.5), t(10, 34, 0.5)] },
  CA: {
    countryName: 'Canada',
    zoneAware: true,
    zoneMap: {
      '加拿大-1区': [t(0.15, 101, 19), t(0.45, 102, 20), t(0.75, 104, 21), t(1, 106, 22), t(2, 106, 22), t(30, 106, 22)],
      '加拿大-2区': [t(0.15, 95, 24), t(0.45, 96, 23), t(0.75, 98, 23), t(1, 100, 23), t(2, 100, 23), t(30, 100, 23)],
      '加拿大-3区': [t(0.15, 102, 36), t(0.45, 103, 36), t(0.75, 105, 36), t(1, 107, 36), t(2, 107, 36), t(30, 107, 36)],
      '加拿大-4区': [t(0.15, 112, 116), t(0.45, 113, 116), t(0.75, 115, 116), t(1, 117, 116), t(2, 117, 116), t(30, 117, 116)],
    },
  },
  AU: {
    countryName: 'Australia',
    zoneAware: true,
    zoneMap: {
      '澳大利亚-1区': [t(0.25, 55, 20), t(0.3, 55, 20), t(0.5, 55, 20), t(1, 55, 20), t(2, 55, 21), t(3, 55, 25), t(4, 55, 40), t(5, 55, 40), t(7, 55, 40), t(10, 55, 40), t(15, 55, 55), t(22, 55, 55)],
      '澳大利亚-2区': [t(0.25, 55, 27), t(0.3, 55, 27), t(0.5, 55, 28), t(1, 55, 32), t(2, 55, 34), t(3, 55, 34), t(4, 55, 50), t(5, 55, 50), t(7, 55, 50), t(10, 55, 50), t(15, 55, 66), t(22, 55, 66)],
      '澳大利亚-3区': [t(0.25, 55, 49), t(0.3, 55, 49), t(0.5, 55, 49), t(1, 55, 72), t(2, 55, 72), t(3, 55, 85), t(4, 55, 110), t(5, 55, 110), t(7, 55, 110), t(10, 55, 110), t(15, 55, 125), t(22, 55, 125)],
      '澳大利亚-4区': [t(0.25, 62, 55), t(0.3, 62, 55), t(0.5, 62, 55), t(1, 62, 95), t(2, 62, 115), t(3, 62, 117), t(4, 62, 140), t(5, 62, 140), t(7, 62, 140), t(10, 62, 140), t(15, 62, 155), t(22, 62, 155)],
    },
  },
  GB: { countryName: 'United Kingdom', tiers: [t(1, 83, 16), t(20, 85, 16)] },
};

function getBillableWeightKg(input: ShippingYanwen484Input): number {
  const quantity = Math.max(1, Math.floor(input.quantity ?? 1));
  const actualWeightKg = Math.max(0, input.weightKg ?? 0);
  return Math.max(actualWeightKg, quantity * DEFAULT_PRODUCT_WEIGHT_KG);
}

function pickTier(tiers: Tier[], billableWeightKg: number): Tier | null {
  return tiers.find((tier) => billableWeightKg > 0 && billableWeightKg <= tier.maxWeightKg) ?? tiers[tiers.length - 1] ?? null;
}

function getZoneInfo(countryCode: string, postalCode?: string): { zone?: string; tiers: Tier[] } | null {
  const rule = RULES[countryCode];
  if (!rule || Array.isArray(rule)) return null;

  if (rule.zoneAware && rule.zoneMap) {
    const matchedZone = postalCode ? findPostalZone(countryCode, postalCode)?.zone : null;
    const defaultZone = countryCode === 'CA' ? '加拿大-3区' : '澳大利亚-3区';
    const zone = matchedZone ?? defaultZone;
    return { zone, tiers: rule.zoneMap[zone] ?? rule.zoneMap[defaultZone] };
  }

  const zoneMatch = postalCode ? findPostalZone(countryCode, postalCode) : null;
  return { zone: zoneMatch?.zone, tiers: rule.tiers ?? [] };
}

function resolveRule(countryCode: string): CountryRule | null {
  const rawRule = RULES[countryCode];
  if (!rawRule) return null;
  return Array.isArray(rawRule) ? rawRule[0] : rawRule;
}

export function getShippingYanwen484Quote(input: ShippingYanwen484Input): ShippingYanwen484Quote | null {
  const countryCode = input.countryCode.trim().toUpperCase();
  const rule = resolveRule(countryCode);
  if (!rule) return null;

  const billableWeightKg = getBillableWeightKg(input);
  const zoneInfo = getZoneInfo(countryCode, input.postalCode);
  const tiers = zoneInfo?.tiers ?? rule.tiers;
  if (!tiers || tiers.length === 0) return null;

  const tier = pickTier(tiers, billableWeightKg);
  if (!tier) return null;

  const baseFreightRmb = billableWeightKg * tier.freightRmbPerKg + tier.processingFeeRmb;
  const surchargeRmb = rule.surchargeRmb?.(baseFreightRmb, billableWeightKg) ?? 0;
  const checkoutPriceRmb = Math.max(0, baseFreightRmb + surchargeRmb + DOMESTIC_TRANSPORT_FEE_RMB - CHECKOUT_DISCOUNT_RMB);

  return {
    carrier: 'Yanwen',
    service: '484',
    countryCode,
    countryName: rule.countryName,
    zone: zoneInfo?.zone,
    billableWeightKg,
    freightRmbPerKg: tier.freightRmbPerKg,
    processingFeeRmb: tier.processingFeeRmb,
    surchargeRmb,
    baseFreightRmb,
    checkoutPriceRmb,
    currency: 'RMB',
  };
}
