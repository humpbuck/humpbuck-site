/**
 * Audit customer-facing i18n coverage per locale vs English.
 * Run: node scripts/audit-customer-facing-i18n.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGET_LOCALES = ["nl", "hu", "ko", "de", "ja", "he"];

/** Page areas → top-level namespaces in merged messages */
const PAGE_AREAS = {
  "Home": ["Home", "Newsletter", "Common"],
  "Shop": ["Shop", "Navigation"],
  "Series (DIGI-TEMP / RM-TONNEAU / RD-ASTRAL)": [
    "Series",
    "SeriesCopy",
    "Home",
  ],
  "Affiliates": ["AffiliatesPublic"],
  "Video tutorial": ["VideoTutorials"],
  "About": ["AboutPage", "PolicyContact"],
  "Wholesale": ["WholesalePage", "WholesaleForm"],
  "Shipping & tax": ["PolicyPages", "ShippingPolicy"],
  "Refund policy": ["PolicyPages", "RefundPolicy"],
  "Privacy policy": ["PolicyPages", "PrivacyPolicy"],
  "Product PDP": ["Product", "Reviews", "ProductCopy"],
  "Cart (bag)": ["Cart", "Navigation", "Floating"],
  "Checkout": [
    "Checkout",
    "CheckoutAddress",
    "CheckoutShipping",
    "Payment",
    "TaxId",
  ],
  "Payment success": ["Success", "Payment"],
  "My account": [
    "Account",
    "AccountCancel",
    "AccountConfirm",
    "AccountReview",
    "AccountSubscribe",
    "AccountAffiliate",
    "OrderStatus",
    "Auth",
  ],
};

function loadMergedMessages(locale) {
  const base = JSON.parse(
    fs.readFileSync(path.join(root, `messages/${locale}.json`), "utf8")
  );
  const mergeFile = (name) => {
    const p = path.join(root, `messages/${name}`);
    if (!fs.existsSync(p)) return {};
    return JSON.parse(fs.readFileSync(p, "utf8"));
  };
  return {
    ...base,
    ...mergeFile(`storefront-extra.${locale}.json`),
    ...mergeFile(`product-copy.${locale}.json`),
    ...mergeFile(`policies.${locale}.json`),
  };
}

function leafPaths(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...leafPaths(v, p));
    else out.push(p);
  }
  return out;
}

function get(obj, dotPath) {
  return dotPath.split(".").reduce((a, k) => a?.[k], obj);
}

/** Same as en but not a proper-noun / universal label */
function isLikelyUntranslated(path, value, enValue) {
  if (value !== enValue) return false;
  if (!value || typeof value !== "string") return false;
  const keep =
    /^(DIGI-TEMP|RM-TONNEAU|RD-ASTRAL|HUMPBUCK|WhatsApp|PayPal|Alipay|Wise|Payoneer|FedEx|DHL|UPS|USPS|Cainiao|B2B|CPF|PCCC|CUIT|RUT|VOEC|…|—|\.)$/.test(
      value
    ) ||
    value.includes("DIGI-TEMP") ||
    value.includes("RM-TONNEAU") ||
    value.includes("RD-ASTRAL") ||
    value.startsWith("TIME · DATE") ||
    /^[A-Z0-9\s·:%+.\-{}]+$/.test(value);
  if (keep) return false;
  if (path.startsWith("LocaleSwitcher.")) return false;
  if (path.includes("methodUps") || path.includes("methodUsps")) return false;
  if (path.includes("methodFedex") || path.includes("methodDhl")) return false;
  if (value.length < 3) return false;
  return true;
}

const en = loadMergedMessages("en");
const enPaths = leafPaths(en);

function pathsInNamespaces(namespaces) {
  return enPaths.filter((p) => namespaces.includes(p.split(".")[0]));
}

const enProducts = Object.keys(en.ProductCopy ?? {});
console.log("\n=== Customer-facing i18n audit (nl, hu, ko, de, ja, he) ===\n");
console.log(`Catalog product-copy slugs in en: ${enProducts.length}\n`);

const summary = [];

for (const locale of TARGET_LOCALES) {
  const loc = loadMergedMessages(locale);
  const areaRows = [];
  let totalUntranslated = 0;
  let totalLeaves = 0;

  for (const [area, namespaces] of Object.entries(PAGE_AREAS)) {
    const paths = pathsInNamespaces(namespaces);
    totalLeaves += paths.length;
    const untranslated = paths.filter((p) =>
      isLikelyUntranslated(p, get(loc, p), get(en, p))
    );
    totalUntranslated += untranslated.length;
    const pct =
      paths.length === 0
        ? 100
        : Math.round(((paths.length - untranslated.length) / paths.length) * 100);
    areaRows.push({ area, pct, missing: untranslated.length, samples: untranslated.slice(0, 5) });
  }

  const productSlugs = enProducts.filter((slug) => {
    const p = `ProductCopy.${slug}.shortDescription`;
    const ev = get(en, p);
    const lv = get(loc, p);
    return ev && (!lv || lv === ev);
  });

  summary.push({ locale, areaRows, productSlugs, totalUntranslated, totalLeaves });
}

for (const { locale, areaRows, productSlugs, totalUntranslated, totalLeaves } of summary) {
  const overall = Math.round(((totalLeaves - totalUntranslated) / totalLeaves) * 100);
  console.log(`--- ${locale.toUpperCase()} (UI strings ~${overall}% localized) ---`);
  for (const { area, pct, missing, samples } of areaRows) {
    const mark = pct >= 98 ? "OK" : pct >= 90 ? "~~" : "!!";
    console.log(`  [${mark}] ${area}: ${pct}% (${missing} still EN)`);
    if (missing > 0 && missing <= 8) {
      for (const s of samples) {
        console.log(`       · ${s}: "${get(en, s)}"`);
      }
    } else if (missing > 8) {
      for (const s of samples) {
        console.log(`       · ${s}: "${get(en, s)}"`);
      }
      console.log(`       … +${missing - 5} more`);
    }
  }
  if (productSlugs.length) {
    console.log(`  [!!] Product copy missing/untranslated: ${productSlugs.length} slugs`);
    console.log(`       ${productSlugs.slice(0, 5).join(", ")}${productSlugs.length > 5 ? "…" : ""}`);
  } else {
    console.log(`  [OK] Product copy: all ${enProducts.length} products localized`);
  }
  console.log("");
}
