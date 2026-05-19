import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function paths(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...paths(v, p));
    else out.push(p);
  }
  return out;
}

function get(obj, p) {
  return p.split(".").reduce((a, k) => a?.[k], obj);
}

const en = JSON.parse(fs.readFileSync(path.join(root, "messages/en.json"), "utf8"));
const eps = paths(en);

const keepExact = new Set([
  "…",
  "—",
  ".",
  "+1",
  "+86 180 2429 0526",
  "email@example.com",
  "{base}/product/your-slug",
  "{name} × {qty}",
  "TIME · DATE · ALM · OUT · STW",
  "0-99: 5% · 100+: 7% · 300+: 9% · 600+: 11% · 1000+: 13% · 1500+: 15%",
]);

function shouldTranslate(p, v) {
  if (keepExact.has(v)) return false;
  if (v === "WhatsApp" || v === "WhatsApp:" || v.startsWith("WhatsApp ")) return false;
  if (["PayPal", "Alipay", "Wise", "Payoneer", "FedEx", "B2B"].includes(v)) return false;
  if (["CPF", "PCCC", "CUIT/CUIL", "RUT", "VOEC No."].includes(v)) return false;
  if (v.includes("Cainiao") || v.includes("Yanwen") || v.includes("DHL Express")) return false;
  if (v.includes("DIGI-TEMP") || v.includes("RM-TONNEAU") || v.includes("RD-ASTRAL")) {
    if (
      p.includes("heroCtaShop") ||
      p.includes("wholesaleBadge") ||
      p.includes("copyright") ||
      p.includes("metaTitle")
    )
      return true;
    return false;
  }
  if (/^HUMPBUCK|· HUMPBUCK/.test(v)) return false;
  return true;
}

for (const loc of ["nl", "hu", "ko", "de", "ja", "he", "es", "pt", "ru", "fr", "it"]) {
  const j = JSON.parse(fs.readFileSync(path.join(root, `messages/${loc}.json`), "utf8"));
  const todo = {};
  for (const p of eps) {
    const e = get(en, p);
    const v = get(j, p);
    if (e === v && shouldTranslate(p, e)) todo[p] = e;
  }
  console.log(loc, Object.keys(todo).length);
  fs.writeFileSync(
    path.join(root, `scripts/_${loc}-todo.json`),
    `${JSON.stringify(todo, null, 2)}\n`,
    "utf8"
  );
}
