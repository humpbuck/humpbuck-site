/** Cainiao OH recipient tax / customs ID rules (from OH workbook notes). */
export type TaxIdRuleKey =
  | "fallback"
  | "BR"
  | "KR"
  | "MX"
  | "AR"
  | "CL"
  | "PE"
  | "EC"
  | "VN"
  | "KZ"
  | "NO";

export type TaxIdRule = {
  ruleKey: TaxIdRuleKey;
  required: boolean;
};

/** English admin / email field labels (match `messages/en.json` → TaxId). */
const TAX_ID_FIELD_LABELS: Record<TaxIdRuleKey, string> = {
  fallback: "Tax ID",
  BR: "CPF/CNPJ",
  KR: "PCCC",
  MX: "RFC or CURP",
  AR: "CUIT/CUIL",
  CL: "RUT",
  PE: "DNI / RUC",
  EC: "National ID",
  VN: "ID / passport",
  KZ: "National ID",
  NO: "VOEC No.",
};

/**
 * Destinations where Cainiao 标准挂号-带电（OH） requires a recipient
 * tax / customs ID to create a waybill (not seller IOSS/VAT/VOEC).
 *
 * From OH workbook customs notes:
 * BR CPF/CNPJ, MX RFC/CURP, CL RUT, AR CUIT/CUIL, PE DNI/RUC,
 * EC national ID, KR PCCC, VN ID/passport, KZ national ID.
 */
const TAX_ID_REQUIRED: ReadonlySet<string> = new Set([
  "BR",
  "MX",
  "CL",
  "AR",
  "PE",
  "EC",
  "KR",
  "VN",
  "KZ",
]);

const TAX_ID_KNOWN: ReadonlySet<string> = new Set([
  ...TAX_ID_REQUIRED,
  "NO", // kept for labels only; not OH-required on checkout
]);

export function getTaxIdRule(countryIso2: string): TaxIdRule {
  const iso = countryIso2.trim().toUpperCase();
  if (TAX_ID_REQUIRED.has(iso)) {
    return { ruleKey: iso as Exclude<TaxIdRuleKey, "fallback">, required: true };
  }
  if (TAX_ID_KNOWN.has(iso)) {
    return { ruleKey: iso as Exclude<TaxIdRuleKey, "fallback">, required: false };
  }
  return { ruleKey: "fallback", required: false };
}

export function taxIdFieldLabel(countryIso2: string): string {
  return TAX_ID_FIELD_LABELS[getTaxIdRule(countryIso2).ruleKey];
}

export function countryRequiresTaxId(countryIso2: string): boolean {
  return getTaxIdRule(countryIso2).required;
}
