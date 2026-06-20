/**
 * Sync product-copy.{locale}.json with DB catalog:
 * - Rename legacy slugs (digitemp-2301 → 2301)
 * - Remove delisted product slugs
 * - Merge mechanical translations from product-copy-mechanical-i18n.json
 *
 * Run: node scripts/sync-product-copy.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = [
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

const LEGACY_RENAMES = {
  "digitemp-2301": "2301",
  "digitemp-2412m": "2412m",
};

const DELISTED_SLUGS = new Set([
  "rd-excalibur01",
  "rm-m01",
  "rm-m02",
  "rm-m03",
  "rm-m04",
  "rm-m05",
  "rm-m06",
  "rm-m07",
  "rm-m08",
  "rm-m09",
  "rm-m10",
  "rm-mx",
  "wholesale-price",
  "custom-logo-fee",
  ...Object.keys(LEGACY_RENAMES),
]);

const mechanicalBatchPath = path.join(root, "scripts/product-copy-mechanical-i18n.json");
const detailBlocksBatchPath = path.join(
  root,
  "scripts/product-copy-detail-blocks-i18n.json",
);
const mechanicalBatch = fs.existsSync(mechanicalBatchPath)
  ? JSON.parse(fs.readFileSync(mechanicalBatchPath, "utf8"))
  : {};
const detailBlocksBatch = fs.existsSync(detailBlocksBatchPath)
  ? JSON.parse(fs.readFileSync(detailBlocksBatchPath, "utf8"))
  : {};

function loadProductCopy(locale) {
  const filePath = path.join(root, `messages/product-copy.${locale}.json`);
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return { filePath, raw, copy: raw.ProductCopy ?? {} };
}

function mergeBlock(existing, incoming) {
  if (!incoming) return existing;
  const out = { ...existing };
  for (const [k, v] of Object.entries(incoming)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0 && Array.isArray(out[k]) && out[k].length) {
      continue;
    }
    if (typeof v === "string" && !v.trim() && typeof out[k] === "string" && out[k].trim()) {
      continue;
    }
    out[k] = v;
  }
  return out;
}

for (const locale of LOCALES) {
  const { filePath, raw, copy } = loadProductCopy(locale);
  const next = {};

  for (const [slug, block] of Object.entries(copy)) {
    if (DELISTED_SLUGS.has(slug)) continue;
    const targetSlug = LEGACY_RENAMES[slug] ?? slug;
    next[targetSlug] = mergeBlock(next[targetSlug], block);
  }

  const localeBatch = mechanicalBatch[locale] ?? {};
  for (const [slug, block] of Object.entries(localeBatch)) {
    next[slug] = mergeBlock(next[slug], block);
  }

  const localeDetailBlocks = detailBlocksBatch[locale] ?? {};
  for (const [slug, blocks] of Object.entries(localeDetailBlocks)) {
    if (!Array.isArray(blocks) || blocks.length === 0) continue;
    next[slug] = mergeBlock(next[slug], { detailBlocks: blocks });
  }

  const sorted = Object.fromEntries(
    Object.keys(next)
      .sort((a, b) => a.localeCompare(b, "en"))
      .map((slug) => [slug, next[slug]]),
  );

  raw.ProductCopy = sorted;
  fs.writeFileSync(filePath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
  console.log(`${locale}: ${Object.keys(sorted).length} products`);
}
