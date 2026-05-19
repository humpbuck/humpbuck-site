/**
 * Build Hungarian locale files from scripts/hu-path-overrides-en.json
 * Run: node scripts/build-hu-locale.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const en = JSON.parse(fs.readFileSync(path.join(root, "messages/en.json"), "utf8"));
const O = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/hu-path-overrides-en.json"), "utf8")
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

function paths(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...paths(v, p));
    else out.push(p);
  }
  return out;
}

function pickTopLevel(full, keys) {
  const part = {};
  for (const k of keys) {
    if (full[k] !== undefined) part[k] = full[k];
  }
  return part;
}

const hu = structuredClone(en);
for (const [p, v] of Object.entries(O)) setPath(hu, p, v);

const partKeys = [
  [
    "SiteMetadata",
    "LocaleSwitcher",
    "Navigation",
    "Footer",
    "Home",
    "Newsletter",
    "Common",
    "WhatsAppFab",
    "Floating",
    "Shop",
  ],
  [
    "Cart",
    "Checkout",
    "CheckoutAddress",
    "CheckoutShipping",
    "Payment",
    "Product",
    "Success",
    "Series",
    "Reviews",
    "TaxId",
  ],
  [
    "Auth",
    "PolicyContact",
    "PolicyPages",
    "RefundPolicy",
    "OrderStatus",
    "Account",
    "AccountCancel",
    "AccountConfirm",
    "AccountReview",
    "AccountSubscribe",
  ],
  [
    "NewsletterConfirmed",
    "UnsubscribeFlow",
    "AffiliatesPublic",
    "AboutPage",
    "WholesalePage",
    "WholesaleForm",
    "VideoTutorials",
    "AccountAffiliate",
  ],
];

for (let i = 0; i < partKeys.length; i++) {
  const part = pickTopLevel(hu, partKeys[i]);
  fs.writeFileSync(
    path.join(root, "messages", `hu-overrides-part${i + 1}.json`),
    `${JSON.stringify(part, null, 2)}\n`,
    "utf8"
  );
  console.log(`Wrote hu-overrides-part${i + 1}.json`);
}

fs.writeFileSync(
  path.join(root, "messages/hu.json"),
  `${JSON.stringify(hu, null, 2)}\n`,
  "utf8"
);
console.log("Wrote messages/hu.json");

const missing = paths(en).filter((p) => !(p in O));
console.log("Overrides:", Object.keys(O).length, "Missing:", missing.length);
if (missing.length) {
  console.error("Missing paths:", missing.slice(0, 20).join(", "));
  process.exit(1);
}
