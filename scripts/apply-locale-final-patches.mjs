/**
 * Apply scripts/locale-final-patches.json (flat dot paths) into messages/{locale}.json
 * Usage: node scripts/apply-locale-final-patches.mjs [locale...]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const patches = {};
for (const file of ["locale-final-patches.json", "locale-final-patches-2.json"]) {
  const part = JSON.parse(
    fs.readFileSync(path.join(root, "scripts", file), "utf8")
  );
  for (const [locale, keys] of Object.entries(part)) {
    patches[locale] = { ...patches[locale], ...keys };
  }
}

function setPath(obj, dotPath, value) {
  const parts = dotPath.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur) || typeof cur[parts[i]] !== "object") cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

const locales = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(patches);

for (const locale of locales) {
  const localePatches = patches[locale];
  if (!localePatches) {
    console.warn("No patches for", locale);
    continue;
  }
  const filePath = path.join(root, `messages/${locale}.json`);
  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
  for (const [p, v] of Object.entries(localePatches)) setPath(json, p, v);
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  console.log(`Patched ${locale}.json (${Object.keys(localePatches).length} keys)`);
}
