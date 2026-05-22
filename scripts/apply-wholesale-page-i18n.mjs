/**
 * Apply scripts/wholesale-page-i18n.json to messages/{locale}.json
 * and persist flat keys for locale rebuild scripts (de, ar, he, ja, hu).
 * Run: node scripts/apply-wholesale-page-i18n.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const en = JSON.parse(fs.readFileSync(path.join(root, "messages/en.json"), "utf8"));
const translations = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/wholesale-page-i18n.json"), "utf8"),
);

const requiredKeys = Object.keys(en.WholesalePage);
const rebuildLocales = new Set(["de", "ar", "he", "ja", "hu"]);

function flatWholesalePage(block) {
  const flat = {};
  for (const [k, v] of Object.entries(block)) {
    flat[`WholesalePage.${k}`] = v;
  }
  return flat;
}

const finalPatchesPath = path.join(root, "scripts/locale-final-patches.json");
const finalPatches = JSON.parse(fs.readFileSync(finalPatchesPath, "utf8"));

const huOverridesPath = path.join(root, "scripts/hu-path-overrides-en.json");
const huOverrides = JSON.parse(fs.readFileSync(huOverridesPath, "utf8"));

for (const [locale, block] of Object.entries(translations)) {
  const wholesalePage = { ...en.WholesalePage };
  for (const key of requiredKeys) {
    if (block[key]) wholesalePage[key] = block[key];
  }

  const missing = requiredKeys.filter((k) => !block[k]);
  if (missing.length) {
    console.warn(`${locale}: missing keys (using en): ${missing.join(", ")}`);
  }

  const messagesPath = path.join(root, "messages", `${locale}.json`);
  const messages = JSON.parse(fs.readFileSync(messagesPath, "utf8"));
  messages.WholesalePage = wholesalePage;
  fs.writeFileSync(messagesPath, `${JSON.stringify(messages, null, 2)}\n`, "utf8");
  console.log(`Updated messages/${locale}.json WholesalePage (${Object.keys(block).length} keys)`);

  if (rebuildLocales.has(locale)) {
    const flat = flatWholesalePage(wholesalePage);
    if (locale === "hu") {
      Object.assign(huOverrides, flat);
    } else {
      finalPatches[locale] = { ...(finalPatches[locale] ?? {}), ...flat };
    }
  }
}

fs.writeFileSync(finalPatchesPath, `${JSON.stringify(finalPatches, null, 2)}\n`, "utf8");
console.log("Updated scripts/locale-final-patches.json");

fs.writeFileSync(huOverridesPath, `${JSON.stringify(huOverrides, null, 2)}\n`, "utf8");
console.log("Updated scripts/hu-path-overrides-en.json");

console.log("Done.");
