/**
 * Remove affiliate / wholesale i18n blocks from messages/{locale}.json.
 * Run: node scripts/cleanup-removed-storefront-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const messagesDir = path.join(root, "messages");

const TOP_LEVEL_DELETE = [
  "AffiliatesPublic",
  "WholesalePage",
  "WholesaleForm",
  "AccountAffiliate",
];

const NESTED_DELETE = {
  Navigation: ["affiliates"],
  Footer: ["affiliates"],
  Home: [
    "wholesaleBadge",
    "wholesaleTitle",
    "wholesaleBody",
    "wholesaleCta",
    "wholesaleWhatsApp",
  ],
  Series: ["wholesale"],
  PolicyPages: ["relatedWholesale"],
  Account: ["navAffiliate"],
};

const ACCOUNT_OVERVIEW_INTRO_EN =
  "Hello, {greeting}. Manage your orders, addresses, and profile from here.";

const localeFiles = fs
  .readdirSync(messagesDir)
  .filter((name) => /^[a-z]{2}\.json$/.test(name));

for (const file of localeFiles) {
  const filePath = path.join(messagesDir, file);
  const messages = JSON.parse(fs.readFileSync(filePath, "utf8"));

  for (const key of TOP_LEVEL_DELETE) {
    delete messages[key];
  }

  for (const [section, keys] of Object.entries(NESTED_DELETE)) {
    if (!messages[section] || typeof messages[section] !== "object") continue;
    for (const key of keys) {
      delete messages[section][key];
    }
  }

  if (messages.Account && typeof messages.Account === "object") {
    if (file === "en.json") {
      messages.Account.overviewIntro = ACCOUNT_OVERVIEW_INTRO_EN;
    } else if (
      typeof messages.Account.overviewIntro === "string" &&
      /affiliate/i.test(messages.Account.overviewIntro)
    ) {
      delete messages.Account.overviewIntro;
    }
  }

  fs.writeFileSync(filePath, `${JSON.stringify(messages, null, 2)}\n`, "utf8");
  console.log(`Updated messages/${file}`);
}
