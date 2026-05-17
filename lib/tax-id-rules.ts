export type TaxIdRuleKey = "fallback" | "BR" | "KR" | "MX" | "NO" | "AR" | "CL";

export type TaxIdRule = {
  ruleKey: TaxIdRuleKey;
  required: boolean;
};

const TAX_ID_RULES: Record<string, true> = {
  BR: true,
  KR: true,
  MX: true,
  NO: true,
  AR: true,
  CL: true,
};

export function getTaxIdRule(countryIso2: string): TaxIdRule {
  const iso = countryIso2.trim().toUpperCase();
  if (iso in TAX_ID_RULES) {
    return { ruleKey: iso as Exclude<TaxIdRuleKey, "fallback">, required: true };
  }
  return { ruleKey: "fallback", required: false };
}
