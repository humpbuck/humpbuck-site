export type TaxIdRuleKey = "fallback" | "BR" | "KR" | "MX" | "NO" | "AR" | "CL";

export type TaxIdRule = {
  ruleKey: TaxIdRuleKey;
  required: boolean;
};

/** English admin / email field labels (match `messages/en.json` → TaxId). */
const TAX_ID_FIELD_LABELS: Record<TaxIdRuleKey, string> = {
  fallback: "Tax ID",
  BR: "CPF",
  KR: "PCCC",
  MX: "RFC or CURP",
  NO: "VOEC No.",
  AR: "CUIT/CUIL",
  CL: "RUT",
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

export function taxIdFieldLabel(countryIso2: string): string {
  return TAX_ID_FIELD_LABELS[getTaxIdRule(countryIso2).ruleKey];
}
