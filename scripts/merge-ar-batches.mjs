/**
 * Optional: merge ar-batch overrides onto he/fr base when API fill is incomplete.
 * Default build: `node scripts/build-ar-locale.mjs` (English fallback for missing keys).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const en = JSON.parse(fs.readFileSync(path.join(root, "messages/en.json"), "utf8"));
const he = JSON.parse(fs.readFileSync(path.join(root, "messages/he.json"), "utf8"));

function setPath(obj, dotPath, value) {
  const parts = dotPath.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur) || typeof cur[parts[i]] !== "object") cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function getPath(obj, dotPath) {
  return dotPath.split(".").reduce((a, k) => a?.[k], obj);
}

const merged = {};
for (let i = 1; i <= 4; i++) {
  Object.assign(
    merged,
    JSON.parse(fs.readFileSync(path.join(root, "scripts", `ar-batch${i}.json`), "utf8"))
  );
}

const finalPatches = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/locale-final-patches.json"), "utf8")
);
const finalPatches2 = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/locale-final-patches-2.json"), "utf8")
);
Object.assign(merged, finalPatches.ar ?? {}, finalPatches2.ar ?? {});

const ar = structuredClone(he);
for (const [p, v] of Object.entries(merged)) {
  const enVal = getPath(en, p);
  if (p === "LocaleSwitcher.ar") {
    setPath(ar, p, v);
    continue;
  }
  if (typeof v === "string" && enVal !== undefined && v !== enVal) {
    setPath(ar, p, v);
  }
}

setPath(ar, "LocaleSwitcher.ar", "العربية");

fs.writeFileSync(
  path.join(root, "messages/ar.json"),
  `${JSON.stringify(ar, null, 2)}\n`,
  "utf8"
);

let arCount = 0;
let heCount = 0;
function walk(o, p = "") {
  for (const [k, v] of Object.entries(o)) {
    const pathKey = p ? `${p}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) walk(v, pathKey);
    else if (typeof v === "string" && /[\u0600-\u06FF]/.test(v)) arCount++;
    else if (typeof v === "string" && /[\u0590-\u05FF]/.test(v)) heCount++;
  }
}
walk(ar);
console.log("Wrote messages/ar.json — Arabic strings:", arCount, "Hebrew fallback:", heCount);
