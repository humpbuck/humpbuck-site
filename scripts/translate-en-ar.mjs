/**
 * Machine-translate en.json paths to ar-batch1..4 (same key split as he batches).
 * Also writes messages/policies.ar.json, storefront-extra.ar.json, product-copy.ar.json
 * Run: node scripts/translate-en-ar.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DELAY_MS = 350;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getPath(obj, dotPath) {
  return dotPath.split(".").reduce((a, k) => a?.[k], obj);
}

function protectPlaceholders(text) {
  const tokens = [];
  let out = text;
  const patterns = [
    /\{[^{}]+\}/g,
    /<[a-zA-Z][^>]*>[\s\S]*?<\/[a-zA-Z][^>]*>/g,
    /<[a-zA-Z][^/>]+\/>/g,
    /<[a-zA-Z][^>]+>/g,
  ];
  for (const re of patterns) {
    out = out.replace(re, (m) => {
      const id = tokens.length;
      tokens.push(m);
      return `__HB${id}__`;
    });
  }
  return { out, tokens };
}

function restorePlaceholders(text, tokens) {
  let out = text;
  for (let i = 0; i < tokens.length; i++) {
    out = out.replace(new RegExp(`__HB${i}__`, "g"), tokens[i]);
    out = out.replace(new RegExp(`__ HB ${i} __`, "gi"), tokens[i]);
  }
  return out;
}

async function translateEn(text) {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (!/[A-Za-z]/.test(trimmed)) return text;

  const { out, tokens } = protectPlaceholders(text);
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(out)}&langpair=en|ar`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.responseStatus !== 200) {
    throw new Error(json.responseDetails || "translate failed");
  }
  let ar = json.responseData.translatedText;
  ar = restorePlaceholders(ar, tokens);
  return ar;
}

async function translateObject(obj, label) {
  const flat = {};
  function walk(o, prefix = "") {
    for (const [k, v] of Object.entries(o)) {
      const p = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) walk(v, p);
      else flat[p] = v;
    }
  }
  walk(obj);
  const keys = Object.keys(flat);
  console.log(`Translating ${label}: ${keys.length} strings…`);
  let n = 0;
  for (const p of keys) {
    const src = flat[p];
    if (typeof src !== "string") continue;
    try {
      flat[p] = await translateEn(src);
    } catch (e) {
      console.error(`  FAIL ${p}:`, e.message);
      flat[p] = src;
    }
    n++;
    if (n % 25 === 0) console.log(`  ${label}: ${n}/${keys.length}`);
    await sleep(DELAY_MS);
  }
  return flat;
}

function flatToNested(flat) {
  const out = {};
  for (const [p, v] of Object.entries(flat)) {
    const parts = p.split(".");
    let cur = out;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in cur)) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = v;
  }
  return out;
}

async function main() {
  const en = JSON.parse(fs.readFileSync(path.join(root, "messages/en.json"), "utf8"));

  for (let i = 1; i <= 4; i++) {
    const outPath = path.join(root, "scripts", `ar-batch${i}.json`);
    const heBatch = JSON.parse(
      fs.readFileSync(path.join(root, "scripts", `he-batch${i}.json`), "utf8")
    );
    const keys = Object.keys(heBatch);
    if (fs.existsSync(outPath)) {
      const existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
      if (Object.keys(existing).length >= keys.length) {
        console.log(`Skip ar-batch${i}.json (${Object.keys(existing).length} keys)`);
        continue;
      }
    }
    const arBatch = {};
    console.log(`ar-batch${i}: ${keys.length} keys`);
    let n = 0;
    for (const p of keys) {
      const src = getPath(en, p);
      if (typeof src !== "string") {
        console.warn(`  skip missing en path: ${p}`);
        continue;
      }
      try {
        arBatch[p] = await translateEn(src);
      } catch (e) {
        console.error(`  FAIL ${p}:`, e.message);
        arBatch[p] = src;
      }
      n++;
      if (n % 20 === 0) console.log(`  batch${i}: ${n}/${keys.length}`);
      await sleep(DELAY_MS);
    }
    fs.writeFileSync(outPath, `${JSON.stringify(arBatch, null, 2)}\n`, "utf8");
    console.log(`Wrote ar-batch${i}.json`);
  }

  for (const name of ["policies", "storefront-extra", "product-copy"]) {
    const arPath = path.join(root, "messages", `${name}.ar.json`);
    if (fs.existsSync(arPath)) {
      console.log(`Skip ${name}.ar.json (exists)`);
      continue;
    }
    const enPath = path.join(root, "messages", `${name}.en.json`);
    const hePath = path.join(root, "messages", `${name}.he.json`);
    let src = JSON.parse(fs.readFileSync(enPath, "utf8"));
    const enFlat = JSON.stringify(src);
    if (enFlat.length < 80 && fs.existsSync(hePath)) {
      console.log(`Using ${name}.he.json as translation source`);
      src = JSON.parse(fs.readFileSync(hePath, "utf8"));
    }
    const flat = await translateObject(src, name);
    const nested = flatToNested(flat);
    fs.writeFileSync(
      path.join(root, "messages", `${name}.ar.json`),
      `${JSON.stringify(nested, null, 2)}\n`,
      "utf8"
    );
    console.log(`Wrote messages/${name}.ar.json`);
  }

  console.log("Done. Run: node scripts/build-ar-locale.mjs");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
