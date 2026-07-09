/**
 * Apply site-wide SEO brand messaging from scripts/seo-brand-i18n.json
 * into messages/{locale}.json (dot-path keys).
 *
 * Run: node scripts/apply-seo-brand-messaging.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const batchPath = path.join(root, "scripts/seo-brand-i18n.json");
const batch = JSON.parse(fs.readFileSync(batchPath, "utf8"));

function setByDotPath(obj, dotPath, value) {
  const parts = dotPath.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!cur[key] || typeof cur[key] !== "object") cur[key] = {};
    cur = cur[key];
  }
  cur[parts[parts.length - 1]] = value;
}

for (const [locale, patches] of Object.entries(batch)) {
  const filePath = path.join(root, "messages", `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`skip missing locale file: ${locale}`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  for (const [dotPath, value] of Object.entries(patches)) {
    setByDotPath(data, dotPath, value);
  }
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`updated messages/${locale}.json (${Object.keys(patches).length} keys)`);
}
