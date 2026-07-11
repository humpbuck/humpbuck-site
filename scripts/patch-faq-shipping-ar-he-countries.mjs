/**
 * Fill Arabic/Hebrew country names in Home.certaintyShippingBody via Intl.DisplayNames
 * (same source as lib/checkout-country-labels.ts).
 * Usage: node scripts/patch-faq-shipping-ar-he-countries.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const batchPath = path.join(root, "scripts/home-faq-shipping-full-i18n-batch.json");
const patches = JSON.parse(fs.readFileSync(batchPath, "utf8"));

const regions = [
  {
    ar: "أمريكا الشمالية والكاريبي",
    he: "צפון אמריקה והקריביים",
    codes: ["CA", "CR", "DO", "SV", "GT", "HN", "MX", "NI", "PA", "PR", "TT", "US"],
  },
  {
    ar: "أمريكا الجنوبية",
    he: "דרום אמריקה",
    codes: ["AR", "BO", "BR", "CL", "CO", "EC", "PY", "PE", "UY"],
  },
  {
    ar: "أوروبا",
    he: "אירופה",
    codes: [
      "AL", "AT", "BE", "BA", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
      "IS", "IE", "IT", "LV", "LT", "LU", "MT", "MD", "ME", "NL", "MK", "NO", "PL", "PT", "RO",
      "RU", "RS", "SK", "SI", "ES", "SE", "CH", "UA", "GB",
    ],
  },
  {
    ar: "الشرق الأوسط",
    he: "המזרח התיכון",
    codes: ["BH", "IQ", "IL", "JO", "KW", "OM", "QA", "SA", "AE"],
  },
  {
    ar: "آسيا",
    he: "אסיה",
    codes: ["HK", "IN", "JP", "KZ", "MY", "MN", "PH", "SG", "KR", "LK", "TH", "VN"],
  },
  {
    ar: "أفريقيا",
    he: "אפריקה",
    codes: ["AO", "GH", "KE", "MA", "NG", "RE", "RW", "ZA", "TZ", "UG"],
  },
  {
    ar: "أوقيانوسيا",
    he: "אוקיאניה",
    codes: ["AU", "NZ"],
  },
];

const intros = {
  ar: "نعم — نشحن إلى جميع أنحاء العالم. تُعالَج الطلبات خلال ثلاثة أيام عمل. يصل التتبع عادةً خلال 7–21 يومًا حسب منطقتك. تُحسب رسوم الشحن (إن وُجدت) وتُعرض عند الدفع قبل إتمام الشراء؛ العديد من الوجهات مؤهلة للشحن القياسي المجاني.",
  he: "כן — אנו שולחים לכל העולם. הזמנות מעובדות תוך שלושה ימי עסקים. משלוח עם מעקב מגיע בדרך כלל תוך 7–21 ימים, בהתאם לאזורכם. דמי משלוח (אם יש) מחושבים ומוצגים בקופה לפני התשלום; יעדים רבים זכאים למשלוח סטנדרטי חינם.",
};

const outros = {
  ar: "إذا لم تكن دولتك مذكورة أعلاه، قد تظل خيارات الشحن السريع (DHL أو FedEx أو UPS أو USPS) متاحة عند الدفع. تتطلب بعض المناطق معلومات جمركية إضافية (مثل رقم ضريبي أو مستندات KYC للهند) — سنرشدك عند الحاجة.",
  he: "אם המדינה שלכם לא מופיעה למעלה, ייתכן שאפשרויות express (DHL, FedEx, UPS או USPS) עדיין זמינות בקופה. באזורים מסוימים נדרש מידע מכס נוסף (למשל מספר מס או מסמכי KYC להודו) — נדריך אתכם במידת הצורך.",
};

function buildBody(intlLocale, langKey) {
  const dn = new Intl.DisplayNames([intlLocale], { type: "region" });
  const bullets = regions
    .map((r) => {
      const countries = r.codes.map((c) => dn.of(c)).join(", ");
      return `• ${r[langKey]} — ${countries}`;
    })
    .join("\n\n");
  return `${intros[langKey]}\n\n\n${bullets}\n\n${outros[langKey]}`;
}

patches.ar["Home.certaintyShippingBody"] = buildBody("ar-SA", "ar");
patches.he["Home.certaintyShippingBody"] = buildBody("he-IL", "he");

fs.writeFileSync(batchPath, `${JSON.stringify(patches, null, 2)}\n`, "utf8");
console.log("Updated", path.relative(root, batchPath));

function setPath(obj, dotPath, value) {
  const parts = dotPath.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur) || typeof cur[parts[i]] !== "object") cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

for (const locale of ["ar", "he"]) {
  const filePath = path.join(root, `messages/${locale}.json`);
  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
  for (const [p, v] of Object.entries(patches[locale])) setPath(json, p, v);
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  console.log(`Patched messages/${locale}.json`);
}
