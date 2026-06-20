/**
 * Apply mechanical-site-i18n.json flat overrides to messages/{locale}.json
 * Run: node scripts/apply-mechanical-site-i18n.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const batchPath = path.join(root, "scripts/mechanical-site-i18n.json");

if (!fs.existsSync(batchPath)) {
  console.error("Missing scripts/mechanical-site-i18n.json");
  process.exit(1);
}

const batch = JSON.parse(fs.readFileSync(batchPath, "utf8"));

function setPath(obj, dotPath, value) {
  const parts = dotPath.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur) || typeof cur[parts[i]] !== "object") cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

for (const [locale, overrides] of Object.entries(batch)) {
  const filePath = path.join(root, `messages/${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`Skip missing locale file: ${locale}`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  for (const [p, v] of Object.entries(overrides)) {
    setPath(data, p, v);
  }
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`${locale}: ${Object.keys(overrides).length} keys`);
}
