/**
 * Remove delisted series (tonneau, rd-astral) from storefront-extra SeriesCopy.
 * Run: node scripts/clean-storefront-extra.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = [
  "en",
  "ar",
  "de",
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

const DELISTED_SERIES = new Set(["tonneau", "rd-astral"]);

for (const locale of LOCALES) {
  const filePath = path.join(root, `messages/storefront-extra.${locale}.json`);
  if (!fs.existsSync(filePath)) continue;
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const copy = raw.SeriesCopy ?? {};
  for (const slug of DELISTED_SERIES) {
    delete copy[slug];
  }
  raw.SeriesCopy = copy;
  fs.writeFileSync(filePath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
  console.log(`${locale}: SeriesCopy keys = ${Object.keys(copy).join(", ") || "(empty)"}`);
}
