/**
 * Add LocaleSwitcher.ar to every messages/*.json locale file.
 * Run: node scripts/patch-locale-switcher-ar.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const messagesDir = path.join(root, "messages");

for (const file of fs.readdirSync(messagesDir)) {
  if (!file.endsWith(".json")) continue;
  if (file.startsWith("_") || file.includes("-overrides")) continue;
  if (
    file.startsWith("storefront-extra.") ||
    file.startsWith("product-copy.") ||
    file.startsWith("policies.")
  ) {
    continue;
  }
  const full = path.join(messagesDir, file);
  const data = JSON.parse(fs.readFileSync(full, "utf8"));
  if (!data.LocaleSwitcher || typeof data.LocaleSwitcher !== "object") continue;
  if (data.LocaleSwitcher.ar === "العربية") continue;
  data.LocaleSwitcher.ar = "العربية";
  fs.writeFileSync(full, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log("Patched", file);
}
