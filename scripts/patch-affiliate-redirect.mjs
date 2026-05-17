import fs from "node:fs";

const p = "app/[locale]/(site)/account/affiliate/page.tsx";
let s = fs.readFileSync(p, "utf8");
s = s.replace(
  'import { Link, redirect } from "@/i18n/navigation";',
  'import { Link } from "@/i18n/navigation";\nimport { redirectWithLocale } from "@/lib/storefront-redirect";',
);
s = s.replace(
  `function goAffiliate(error?: string): never {
  if (!error) redirect("/account/affiliate");
  redirect(\`/account/affiliate?error=\${encodeURIComponent(error)}\`);
}`,
  `async function goAffiliate(error?: string): Promise<never> {
  if (!error) await redirectWithLocale("/account/affiliate");
  await redirectWithLocale(\`/account/affiliate?error=\${encodeURIComponent(error!)}\`);
}`,
);
s = s.replace(/goAffiliate\(/g, "await goAffiliate(");
s = s.replace(/([^a-zA-Z])redirect\(/g, "$1await redirectWithLocale(");
fs.writeFileSync(p, s);
console.log("affiliate ok");
