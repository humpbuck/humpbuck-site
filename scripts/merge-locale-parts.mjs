/**
 * Deep-merge messages/{locale}-overrides-part*.json (or _*-src-part*.json) into messages/{locale}.json
 * Usage: node scripts/merge-locale-parts.mjs ko
 *        node scripts/merge-locale-parts.mjs de --glob "_de-src-part*.json"
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const locale = process.argv[2];
const globArg = process.argv[3] === "--glob" ? process.argv[4] : `${locale}-overrides-part*.json`;

if (!locale) {
  console.error("Usage: node scripts/merge-locale-parts.mjs <locale> [--glob pattern]");
  process.exit(1);
}

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
}

function listPartFiles() {
  const dir = path.join(root, "messages");
  const all = fs.readdirSync(dir);
  const re = new RegExp(
    "^" + globArg.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$"
  );
  return all
    .filter((f) => re.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

const targetPath = path.join(root, `messages/${locale}.json`);
const parts = listPartFiles();
if (!parts.length) {
  console.error("No part files matched:", globArg);
  process.exit(1);
}

const target = JSON.parse(fs.readFileSync(targetPath, "utf8"));
for (const file of parts) {
  const part = JSON.parse(fs.readFileSync(path.join(root, "messages", file), "utf8"));
  deepMerge(target, part);
  console.log("Merged", file);
}

fs.writeFileSync(targetPath, `${JSON.stringify(target, null, 2)}\n`, "utf8");
console.log("Wrote", targetPath);
