/**
 * Build German locale from en.json + scripts/de-batch1..4.json flat overrides.
 * Run: node scripts/build-de-locale.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const en = JSON.parse(fs.readFileSync(path.join(root, "messages/en.json"), "utf8"));

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

const O = {};
for (let i = 1; i <= 4; i++) {
  const batch = JSON.parse(
    fs.readFileSync(path.join(root, `scripts/de-batch${i}.json`), "utf8")
  );
  Object.assign(O, batch);
}
const finalPatches = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/locale-final-patches.json"), "utf8")
);
const finalPatches2 = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/locale-final-patches-2.json"), "utf8")
);
Object.assign(O, finalPatches.de ?? {}, finalPatches2.de ?? {});

const de = structuredClone(en);
for (const [p, v] of Object.entries(O)) setPath(de, p, v);

fs.writeFileSync(
  path.join(root, "messages/de.json"),
  `${JSON.stringify(de, null, 2)}\n`,
  "utf8"
);
console.log("Wrote messages/de.json");

const missing = paths(en).filter((p) => !(p in O));
console.log("Overrides:", Object.keys(O).length, "Missing:", missing.length);
if (missing.length) {
  console.error("Missing paths:", missing.slice(0, 20).join(", "));
  process.exit(1);
}
