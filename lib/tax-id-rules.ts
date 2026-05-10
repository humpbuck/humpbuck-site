type TaxIdRule = {
  label: string;
  placeholder: string;
  required: boolean;
};

const TAX_ID_RULES: Record<string, TaxIdRule> = {
  BR: {
    label: "CPF",
    placeholder: "Enter CPF (11 digits)",
    required: true,
  },
  KR: {
    label: "PCCC",
    placeholder: "Format: P + 12 digits",
    required: true,
  },
  MX: {
    label: "RFC or CURP",
    placeholder: "RFC (13 characters) or CURP (18 characters)",
    required: true,
  },
  NO: {
    label: "VOEC No.",
    placeholder: "7 digits",
    required: true,
  },
  AR: {
    label: "CUIT/CUIL",
    placeholder: "11 digits",
    required: true,
  },
  CL: {
    label: "RUT",
    placeholder: "Format: 12345678-9 or 1234567-K",
    required: true,
  },
};

export function getTaxIdRule(countryIso2: string): TaxIdRule {
  return TAX_ID_RULES[countryIso2] ?? {
    label: "Tax ID",
    placeholder: "Enter tax ID",
    required: false,
  };
}
