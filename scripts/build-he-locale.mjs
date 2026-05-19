/**
 * Build Hebrew locale messages/he.json from scripts/he-batch1-4.json
 * Run: node scripts/build-he-locale.mjs
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

const merged = {};
for (let i = 1; i <= 4; i++) {
  const batchPath = path.join(root, "scripts", `he-batch${i}.json`);
  const batch = JSON.parse(fs.readFileSync(batchPath, "utf8"));
  Object.assign(merged, batch);
}

const finalPatches = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/locale-final-patches.json"), "utf8")
);
const finalPatches2 = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/locale-final-patches-2.json"), "utf8")
);
Object.assign(merged, finalPatches.he ?? {}, finalPatches2.he ?? {});

const allPaths = paths(en);
const missing = allPaths.filter((p) => !(p in merged));
if (missing.length) {
  console.error("Missing", missing.length, "paths:", missing.slice(0, 20).join(", "));
  process.exit(1);
}

const he = structuredClone(en);
for (const [p, v] of Object.entries(merged)) setPath(he, p, v);

fs.writeFileSync(
  path.join(root, "messages/he.json"),
  `${JSON.stringify(he, null, 2)}\n`,
  "utf8"
);
console.log("Wrote messages/he.json with", Object.keys(merged).length, "overrides");
