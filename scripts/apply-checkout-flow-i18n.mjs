/**
 * Apply scripts/checkout-flow-i18n-batch.json into messages/{locale}.json
 * Usage: node scripts/apply-checkout-flow-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const patches = JSON.parse(
  fs.readFileSync(path.join(root, "scripts", "checkout-flow-i18n-batch.json"), "utf8"),
);

function setPath(obj, dotPath, value) {
  const parts = dotPath.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur) || typeof cur[parts[i]] !== "object") cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

for (const locale of Object.keys(patches)) {
  const localePatches = patches[locale];
  const filePath = path.join(root, `messages/${locale}.json`);
  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
  for (const [p, v] of Object.entries(localePatches)) setPath(json, p, v);
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  console.log(`Patched ${locale}.json (${Object.keys(localePatches).length} keys)`);
}
