/** Site-wide display (reference) currency — checkout still charges USD. */

export const DISPLAY_CURRENCY_COOKIE = "humpbuck-display-currency";

export const DISPLAY_CURRENCY_CODES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "CAD",
  "HKD",
  "SGD",
  "CHF",
  "KRW",
  "AED",
  "SAR",
  "THB",
  "MYR",
  "INR",
  "BRL",
  "MXN",
  "NZD",
  "SEK",
  "NOK",
] as const;

export type DisplayCurrencyCode = (typeof DISPLAY_CURRENCY_CODES)[number];

export interface DisplayCurrencyMeta {
  code: DisplayCurrencyCode;
  symbol: string;
  /** ISO 3166-1 alpha-2 for emoji flag (`EU` for euro). */
  flagRegion: string;
  label: string;
}

export const DISPLAY_CURRENCIES: DisplayCurrencyMeta[] = [
  { code: "USD", symbol: "$", flagRegion: "US", label: "US Dollar" },
  { code: "EUR", symbol: "€", flagRegion: "EU", label: "Euro" },
  { code: "GBP", symbol: "£", flagRegion: "GB", label: "British Pound" },
  { code: "JPY", symbol: "¥", flagRegion: "JP", label: "Japanese Yen" },
  { code: "AUD", symbol: "A$", flagRegion: "AU", label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", flagRegion: "CA", label: "Canadian Dollar" },
  { code: "HKD", symbol: "HK$", flagRegion: "HK", label: "Hong Kong Dollar" },
  { code: "SGD", symbol: "S$", flagRegion: "SG", label: "Singapore Dollar" },
  { code: "CHF", symbol: "CHF", flagRegion: "CH", label: "Swiss Franc" },
  { code: "KRW", symbol: "₩", flagRegion: "KR", label: "South Korean Won" },
  { code: "AED", symbol: "AED", flagRegion: "AE", label: "UAE Dirham" },
  { code: "SAR", symbol: "SAR", flagRegion: "SA", label: "Saudi Riyal" },
  { code: "THB", symbol: "฿", flagRegion: "TH", label: "Thai Baht" },
  { code: "MYR", symbol: "RM", flagRegion: "MY", label: "Malaysian Ringgit" },
  { code: "INR", symbol: "₹", flagRegion: "IN", label: "Indian Rupee" },
  { code: "BRL", symbol: "R$", flagRegion: "BR", label: "Brazilian Real" },
  { code: "MXN", symbol: "MX$", flagRegion: "MX", label: "Mexican Peso" },
  { code: "NZD", symbol: "NZ$", flagRegion: "NZ", label: "New Zealand Dollar" },
  { code: "SEK", symbol: "kr", flagRegion: "SE", label: "Swedish Krona" },
  { code: "NOK", symbol: "kr", flagRegion: "NO", label: "Norwegian Krone" },
];

export const DISPLAY_CURRENCY_BY_CODE = Object.fromEntries(
  DISPLAY_CURRENCIES.map((c) => [c.code, c]),
) as Record<DisplayCurrencyCode, DisplayCurrencyMeta>;

export function isDisplayCurrencyCode(value: string): value is DisplayCurrencyCode {
  return (DISPLAY_CURRENCY_CODES as readonly string[]).includes(value);
}

export function flagEmojiFromRegion(region: string): string {
  const r = region.toUpperCase();
  if (r === "EU") return "🇪🇺";
  const base = 0x1f1e6;
  return [...r].map((ch) => String.fromCodePoint(base + ch.charCodeAt(0) - 65)).join("");
}

/** Default reference currency when no cookie is set. */
export const LOCALE_DEFAULT_DISPLAY_CURRENCY: Record<string, DisplayCurrencyCode> = {
  en: "USD",
  de: "EUR",
  fr: "EUR",
  es: "EUR",
  it: "EUR",
  nl: "EUR",
  pt: "EUR",
  hu: "EUR",
  ru: "USD",
  ko: "KRW",
  ja: "JPY",
  he: "USD",
  ar: "AED",
};

export function inferDisplayCurrencyFromLocale(locale: string): DisplayCurrencyCode {
  const base = locale.split("-")[0].toLowerCase();
  return LOCALE_DEFAULT_DISPLAY_CURRENCY[base] ?? "USD";
}

export const ZERO_DECIMAL_DISPLAY_CURRENCIES: ReadonlySet<DisplayCurrencyCode> = new Set([
  "JPY",
  "KRW",
]);

export function formatConvertedAmount(
  usd: number,
  code: DisplayCurrencyCode,
  rateFromUsd: number,
): string {
  const local = usd * rateFromUsd;
  const meta = DISPLAY_CURRENCY_BY_CODE[code];
  const digits = ZERO_DECIMAL_DISPLAY_CURRENCIES.has(code) ? 0 : 2;
  const body = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(local);
  if (code === "USD") return `$${body}`;
  if (meta.symbol.length <= 2 || meta.symbol === "RM") {
    return `${meta.symbol}${body}`;
  }
  return `${meta.symbol} ${body}`;
}

export function readDisplayCurrencyCookie(): DisplayCurrencyCode | null {
  if (typeof document === "undefined") return null;
  const prefix = `${DISPLAY_CURRENCY_COOKIE}=`;
  const entry = document.cookie.split("; ").find((row) => row.startsWith(prefix));
  if (!entry) return null;
  const value = decodeURIComponent(entry.slice(prefix.length));
  return isDisplayCurrencyCode(value) ? value : null;
}

export function writeDisplayCurrencyCookie(code: DisplayCurrencyCode): void {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${DISPLAY_CURRENCY_COOKIE}=${encodeURIComponent(code)};path=/;max-age=${maxAge};SameSite=Lax`;
}
