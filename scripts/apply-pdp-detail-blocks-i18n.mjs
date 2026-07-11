/**
 * Merge scripts/pdp-detail-blocks-i18n-data.mjs into messages/product-copy.{locale}.json
 * Usage: node scripts/apply-pdp-detail-blocks-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import data from "./pdp-detail-blocks-i18n-data.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

for (const [locale, products] of Object.entries(data)) {
  const filePath = path.join(root, `messages/product-copy.${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`Skip missing locale file: ${locale}`);
    continue;
  }

  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!json.ProductCopy || typeof json.ProductCopy !== "object") {
    json.ProductCopy = {};
  }

  for (const [slug, patch] of Object.entries(products)) {
    if (!patch?.detailBlocks?.length) continue;

    if (slug === "9207g" && !json.ProductCopy["9207g"] && json.ProductCopy["9027g"]) {
      json.ProductCopy["9207g"] = deepClone(json.ProductCopy["9027g"]);
    }

    if (!json.ProductCopy[slug]) {
      json.ProductCopy[slug] = {};
    }

    json.ProductCopy[slug].detailBlocks = patch.detailBlocks;
  }

  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  console.log(
    `${locale}: merged detailBlocks for ${Object.keys(products).length} products`,
  );
}

console.log(`Done — ${Object.keys(data).length} locales`);
