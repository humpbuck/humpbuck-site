/**
 * Apply scripts/watch-collections-i18n.json into messages/{locale}.json
 * under the WatchCollections namespace.
 *
 * Run: node scripts/apply-watch-collections-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const batchPath = path.join(root, "scripts", "watch-collections-i18n.json");
const batch = JSON.parse(fs.readFileSync(batchPath, "utf8"));

const locales = Object.keys(batch);
const updated = [];

for (const locale of locales) {
  const filePath = path.join(root, "messages", `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`skip missing messages/${locale}.json`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  data.WatchCollections = batch[locale];
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  updated.push(locale);
  console.log(`updated messages/${locale}.json (WatchCollections)`);
}

console.log(`done: ${updated.join(", ")}`);
