import fs from "node:fs";
import path from "node:path";

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.tsx?$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

const root = process.cwd();

/** Storefront: swap next/link → @/i18n/navigation */
const linkRoots = [
  path.join(root, "app/[locale]/(site)"),
  path.join(root, "components/site"),
  path.join(root, "components/cart"),
  path.join(root, "components/account"),
];
for (const dir of linkRoots) {
  for (const file of walk(dir)) {
    let s = fs.readFileSync(file, "utf8");
    const before = s;
    s = s.replace(/from "next\/link"/g, 'from "@/i18n/navigation"');
    s = s.replace(/from 'next\/link'/g, "from '@/i18n/navigation'");
    if (s !== before) fs.writeFileSync(file, s);
  }
}

const consent = path.join(root, "components/analytics/site-analytics-consent.tsx");
if (fs.existsSync(consent)) {
  let s = fs.readFileSync(consent, "utf8");
  const before = s;
  s = s.replace(/from "next\/link"/g, 'from "@/i18n/navigation"');
  s = s.replace(/from 'next\/link'/g, "from '@/i18n/navigation'");
  if (s !== before) fs.writeFileSync(consent, s);
}

/** Client routers: account flows stay in current locale */
const routerFiles = [
  ...walk(path.join(root, "components/account")).filter((f) =>
    /(review-append-form|buyer-confirm-received-button|account-avatar-picker|order-edit-shipping-form|buyer-cancel-order|affiliate-live-refresh|product-review-form)\.tsx$/.test(
      f,
    ),
  ),
  ...walk(path.join(root, "app/[locale]/(site)/auth")).filter((f) => f.endsWith(".tsx")),
];
for (const file of routerFiles) {
  let s = fs.readFileSync(file, "utf8");
  const before = s;
  s = s.replace(
    /import \{ useRouter, useSearchParams \} from "next\/navigation";/g,
    'import { useRouter } from "@/i18n/navigation";\nimport { useSearchParams } from "next/navigation";',
  );
  s = s.replace(
    /import \{ useRouter, useSearchParams \} from 'next\/navigation';/g,
    "import { useRouter } from '@/i18n/navigation';\nimport { useSearchParams } from 'next/navigation';",
  );
  s = s.replace(
    /import \{ useRouter \} from "next\/navigation";/g,
    'import { useRouter } from "@/i18n/navigation";',
  );
  s = s.replace(/import \{ useRouter \} from 'next\/navigation';/g, "import { useRouter } from '@/i18n/navigation';");
  if (s !== before) fs.writeFileSync(file, s);
}

/** Account sidebar: active states use locale-stripped pathname */
const sidebar = path.join(root, "components/account/account-sidebar.tsx");
if (fs.existsSync(sidebar)) {
  let s = fs.readFileSync(sidebar, "utf8");
  s = s.replace(
    /import Link from "@\/i18n\/navigation";\nimport \{ usePathname \} from "next\/navigation";/,
    'import { Link, usePathname } from "@/i18n/navigation";',
  );
  fs.writeFileSync(sidebar, s);
}

console.log("apply-i18n-imports: done");
