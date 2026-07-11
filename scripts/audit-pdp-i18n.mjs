import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const lines = fs.readFileSync(path.join(root, ".tmp/d1-remote-export.sql"), "utf8").split("\n");

function extractDetailJson(line) {
  const start = line.indexOf('[{"image"');
  if (start < 0) return [];
  let depth = 0;
  let buf = "";
  for (let j = start; j < line.length; j++) {
    const c = line[j];
    if (c === "[") depth++;
    if (depth > 0) buf += c;
    if (c === "]") {
      depth--;
      if (depth === 0) break;
    }
  }
  try {
    return JSON.parse(buf);
  } catch {
    return [];
  }
}

function extractSpecsJson(line) {
  const start = line.indexOf('[{"label"');
  if (start < 0) return [];
  let depth = 0;
  let buf = "";
  for (let j = start; j < line.length; j++) {
    const c = line[j];
    if (c === "[") depth++;
    if (depth > 0) buf += c;
    if (c === "]") {
      depth--;
      if (depth === 0) break;
    }
  }
  try {
    return JSON.parse(buf);
  } catch {
    return [];
  }
}

const products = [];

for (const line of lines) {
  if (!line.includes('INSERT INTO "CatalogProduct"')) continue;
  const slug = line.match(/VALUES\('[^']+','([a-z0-9-]+)'/)?.[1];
  if (!slug) continue;
  const details = extractDetailJson(line);
  const specs = extractSpecsJson(line);
  products.push({ slug, details, specs });
}

const locales = ["ja", "fr", "de", "es", "it", "pt", "nl", "ko", "ru", "hu", "he", "ar"];

console.log(`Products: ${products.length}\n`);
console.log("=== Detail block gaps ===\n");

for (const { slug, details } of products) {
  const dbBlocks = details.filter((d) => d.title?.trim() || d.body?.trim());
  if (dbBlocks.length === 0) continue;

  const gaps = [];
  for (const loc of locales) {
    const copyPath = path.join(root, `messages/product-copy.${loc}.json`);
    const copy = JSON.parse(fs.readFileSync(copyPath, "utf8"));
    const keys = [slug, slug.split("-").pop()];
    let blocks = null;
    for (const k of keys) {
      if (copy.ProductCopy?.[k]?.detailBlocks?.length) {
        blocks = copy.ProductCopy[k].detailBlocks;
        break;
      }
    }
    const copyLen = blocks?.length ?? 0;
    if (copyLen < dbBlocks.length) gaps.push(`${loc}:${copyLen}/${dbBlocks.length}`);
  }

  if (gaps.length) {
    console.log(`${slug} (${dbBlocks.length} DB blocks)`);
    dbBlocks.forEach((b, i) => console.log(`  [${i}] ${b.title}`));
    console.log(`  gaps: ${[...new Set(gaps)].join(", ")}\n`);
  }
}

console.log("=== Unique spec values ===\n");
const values = new Set();
for (const { specs } of products) {
  for (const s of specs) {
    if (s.value?.trim()) values.add(s.value.trim());
  }
}
console.log([...values].sort().join("\n"));
