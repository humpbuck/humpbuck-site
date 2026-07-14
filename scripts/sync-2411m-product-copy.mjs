/**
 * Copy custom-watch shortDescription to 2411m in all product-copy locale files.
 * Run: node scripts/sync-2411m-product-copy.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const enShort =
  "PLEASE READ BEFORE ORDERING: This is a dedicated payment link for Custom Watches only. Please DO NOT purchase directly. You must first contact our customer service to confirm your design, quantity, and final price. Once agreed, our team will guide you on how to use this link to complete your payment. Thank you!";

const locales = [
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

for (const locale of locales) {
  const filePath = path.join(root, "messages", `product-copy.${locale}.json`);
  if (!fs.existsSync(filePath)) continue;

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!data.ProductCopy) data.ProductCopy = {};

  const custom = data.ProductCopy["custom-watch"];
  const existing = data.ProductCopy["2411m"] ?? {};
  const shortDescription =
    locale === "en"
      ? enShort
      : custom?.shortDescription ?? enShort;

  data.ProductCopy["2411m"] = {
    ...existing,
    shortDescription,
  };

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`updated product-copy.${locale}.json → 2411m`);
}
