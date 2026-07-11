/**
 * Apply scripts/hero-watches-brand-i18n.json — replace "HUMPBUCK Watches" with
 * "HUMPBUCK {local word for watches}" in messages/{locale}.json
 * Usage: node scripts/apply-hero-watches-brand-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const replacements = JSON.parse(
  fs.readFileSync(path.join(root, "scripts", "hero-watches-brand-i18n.json"), "utf8"),
);

const storefrontLocales = [
  "ar",
  "de",
  "en",
  "es",
  "fr",
  "he",
  "hu",
  "it",
  "ja",
  "ko",
  "nl",
  "pt",
  "ru",
];

for (const locale of storefrontLocales) {
  const to = replacements[locale];
  if (!to) {
    console.warn("No replacement for", locale);
    continue;
  }
  const filePath = path.join(root, `messages/${locale}.json`);
  const raw = fs.readFileSync(filePath, "utf8");
  const count = (raw.match(/HUMPBUCK Watches/g) ?? []).length;
  if (count === 0) {
    console.log(`${locale}.json: already updated (0 matches)`);
    continue;
  }
  const updated = raw.replaceAll("HUMPBUCK Watches", to);
  fs.writeFileSync(filePath, updated, "utf8");
  console.log(`${locale}.json: replaced ${count} occurrence(s) → "${to}"`);
}
