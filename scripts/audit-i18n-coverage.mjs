/**
 * Report translation gaps: messages vs English, homepage CMS overrides, product specs.
 * Usage: node scripts/audit-i18n-coverage.mjs [locale]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadProjectEnv } from "./load-project-env.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const locales = process.argv[2]
  ? [process.argv[2]]
  : ["ar", "de", "es", "fr", "he", "hu", "it", "ja", "ko", "nl", "pt", "ru"];

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flatten(v, p));
    else out[p] = v;
  }
  return out;
}

loadProjectEnv();

const en = flatten(JSON.parse(fs.readFileSync(path.join(root, "messages/en.json"), "utf8")));

console.log("=== 1) messages/{locale}.json keys still identical to en ===\n");
for (const loc of locales) {
  const f = flatten(JSON.parse(fs.readFileSync(path.join(root, `messages/${loc}.json`), "utf8")));
  const same = Object.keys(en).filter(
    (k) => f[k] === en[k] && typeof en[k] === "string" && en[k].length > 3 && !k.startsWith("LocaleSwitcher."),
  );
  console.log(`${loc}: ${same.length} strings match en`);
  same.slice(0, 8).forEach((k) => console.log(`  · ${k}`));
  if (same.length > 8) console.log(`  … +${same.length - 8} more`);
  console.log();
}

console.log("=== 2) SiteHomeContent CMS (DB) — fields that override i18n on EN only ===\n");
console.log(
  "Non-EN locales now prefer messages/*.json (see lib/site-home-cms-locale.ts).\n" +
    "If EN shows unexpected copy, check admin → Homepage or D1 SiteHomeContent row.\n",
);

try {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaLibSql } = await import("@prisma/adapter-libsql");
  const url = process.env.DATABASE_URL || "file:./dev.db";
  const prisma = new PrismaClient({
    adapter: new PrismaLibSql({ url: url.replace(/^file:/, "file:") }),
  });
  const row = await prisma.siteHomeContent.findUnique({ where: { id: "default" } });
  if (!row) {
    console.log("(no SiteHomeContent row — storefront uses messages/en.json fallbacks)\n");
  } else {
    const textFields = [
      "heroTitle",
      "heroLead",
      "momentsHeading",
      "momentsCard1Title",
      "couponTitle",
      "certaintyHeading",
      "faqItemsJson",
      "aboutParagraph1",
    ];
    for (const field of textFields) {
      const val = String(row[field] ?? "").trim();
      if (val) console.log(`  ${field}: ${val.slice(0, 72)}${val.length > 72 ? "…" : ""}`);
    }
    console.log(`\n  DB: ${url}\n  updatedAt: ${row.updatedAt.toISOString()}\n`);
  }
  await prisma.$disconnect();
} catch (e) {
  console.log(`(skipped DB read: ${e instanceof Error ? e.message : e})\n`);
}

console.log("=== 3) Product-copy overrides (messages/product-copy.{locale}.json) ===\n");
for (const loc of locales) {
  const file = path.join(root, `messages/product-copy.${loc}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const slugs = Object.keys(data.ProductCopy ?? {});
  console.log(`${loc}: ${slugs.length} product slug overrides`);
}
console.log(
  "\nProduct names like AUTOMATIC 9220 → lib/storefront-locale.ts (prefix map).\n" +
    "Spec labels MOVEMENT / WATERPROOF → same file (SPEC_LABEL_ALIASES).\n",
);

console.log("=== Sync local with production ===");
console.log(
  "  Live (recommended): HUMPBUCK_D1_REMOTE=1 in .env.local + npx wrangler login + restart npm run dev.\n" +
    "  Offline snapshot: npm run db:d1:pull → prisma/dev.db (DATABASE_URL=file:./dev.db).\n" +
    "  D1 has no remote DATABASE_URL — production uses Cloudflare binding DB.\n" +
    "  UI strings: messages/*.json + apply-*-i18n.mjs scripts; deploy code to go live.\n",
);
