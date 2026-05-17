import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const page = path.join(root, "app/[locale]/(site)/terms/page.tsx");
const s = fs.readFileSync(page, "utf8");
const i = s.indexOf('<div className="mt-8 space-y-6');
const j = s.indexOf('<p className="mt-12 border-t');
if (i < 0 || j < 0) {
  console.error("slice failed", { i, j });
  process.exit(1);
}
const body = s.slice(i, j).trimEnd();
const out = `import { Link } from "@/i18n/navigation";
import { PolicyContactCard } from "@/components/site/PolicyContactCard";

export function TermsBodyEn() {
  return (
    <>
${body}
    </>
  );
}
`;
fs.writeFileSync(path.join(root, "components/site/terms-body-en.tsx"), out);
console.log("wrote terms-body-en.tsx", body.length);
