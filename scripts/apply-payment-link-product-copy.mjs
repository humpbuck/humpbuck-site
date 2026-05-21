/**
 * Merge payment-link product translations into messages/product-copy.{locale}.json
 * Run: node scripts/apply-payment-link-product-copy.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/payment-link-product-copy.json"), "utf8"),
);

for (const [locale, products] of Object.entries(source)) {
  const filePath = path.join(root, `messages/product-copy.${locale}.json`);
  const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!doc.ProductCopy || typeof doc.ProductCopy !== "object") {
    doc.ProductCopy = {};
  }
  for (const [slug, block] of Object.entries(products)) {
    doc.ProductCopy[slug] = block;
  }
  fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  console.log(`Updated ${path.relative(root, filePath)}`);
}
