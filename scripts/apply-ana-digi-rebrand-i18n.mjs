/**
 * Apply ANA-DIGI rebrand copy from scripts/ana-digi-rebrand-i18n.json
 * into messages/{locale}.json (dot-path keys). Also refreshes shared chips.
 *
 * Run: node scripts/apply-ana-digi-rebrand-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const batchPath = path.join(root, "scripts/ana-digi-rebrand-i18n.json");
const batch = JSON.parse(fs.readFileSync(batchPath, "utf8"));

const SHARED_CHIPS = {
  "Home.mechanicalHeroChipAutomatic": "TIME",
  "Home.mechanicalHeroChipSkeleton": "DATE",
  "Home.mechanicalHeroChipFinishing": "ALM",
  "Home.mechanicalHeroChipDuT": "DU.T",
  "Home.mechanicalHeroChipStW": "ST.W",
  "Home.mechanicalHeroBadge": "ANA-DIGI · TEMP",
};

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

const locales = fs
  .readdirSync(path.join(root, "messages"))
  .filter((f) => /^[a-z]{2}\.json$/.test(f))
  .map((f) => f.replace(/\.json$/, ""));

for (const locale of locales) {
  const filePath = path.join(root, "messages", `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const patches = { ...SHARED_CHIPS, ...(batch[locale] || batch.en) };
  for (const [dotPath, value] of Object.entries(patches)) {
    setByDotPath(data, dotPath, value);
  }
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`updated messages/${locale}.json (${Object.keys(patches).length} keys)`);
}

// Keep seo-brand-i18n.json SEO keys aligned for locales we patched.
const seoPath = path.join(root, "scripts/seo-brand-i18n.json");
const seo = JSON.parse(fs.readFileSync(seoPath, "utf8"));
const seoKeys = [
  "SiteMetadata.titleDefault",
  "SiteMetadata.descriptionDefault",
  "SiteMetadata.ogTitle",
  "SiteMetadata.ogDescription",
  "Home.metaTitle",
  "Home.metaDescription",
  "Home.ogTitle",
  "Home.ogDescription",
  "Home.mechanicalHeroBadge",
  "Home.mechanicalHeroTitle",
  "Home.mechanicalHeroLead",
  "Home.mechanicalHeroChipAutomatic",
  "Home.mechanicalHeroChipSkeleton",
  "Home.mechanicalHeroChipFinishing",
  "Home.mechanicalHeroChipDuT",
  "Home.mechanicalHeroChipStW",
  "Footer.tagline",
  "Shop.metaTitle",
  "Shop.metaDescription",
  "Shop.ogTitle",
  "Shop.ogDescription",
  "Shop.title",
  "AboutPage.metaTitle",
  "AboutPage.metaDescription",
  "BlogPage.metaDescription",
  "BlogPage.intro",
  "Home.recommendedIntro",
  "Home.newsletterBody",
];
for (const locale of Object.keys(seo)) {
  const source = batch[locale] || batch.en;
  for (const key of seoKeys) {
    if (source[key] != null) seo[locale][key] = source[key];
    else if (SHARED_CHIPS[key] != null) seo[locale][key] = SHARED_CHIPS[key];
  }
}
fs.writeFileSync(seoPath, `${JSON.stringify(seo, null, 2)}\n`, "utf8");
console.log("updated scripts/seo-brand-i18n.json");
