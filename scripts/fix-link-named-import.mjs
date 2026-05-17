import fs from "node:fs";
import path from "node:path";

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.name === "node_modules" || ent.name === ".next") continue;
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.tsx?$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

const root = process.cwd();
const dirs = [
  path.join(root, "app/[locale]"),
  path.join(root, "components/site"),
  path.join(root, "components/cart"),
  path.join(root, "components/account"),
  path.join(root, "components/analytics"),
];
let count = 0;
for (const dir of dirs) {
  for (const file of walk(dir)) {
    let s = fs.readFileSync(file, "utf8");
    const orig = s;
    s = s.replace(
      /import Link from "@\/i18n\/navigation";/g,
      'import { Link } from "@/i18n/navigation";',
    );
    if (s !== orig) {
      fs.writeFileSync(file, s);
      count += 1;
    }
  }
}
console.log("Link imports:", count);
