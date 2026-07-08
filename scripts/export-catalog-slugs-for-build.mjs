/**
 * Refresh `scripts/catalog-build-slugs.json` from remote D1 before cf-build.
 * When wrangler/remote is unavailable, keep the committed file (do not fail the build).
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const out = join(process.cwd(), "scripts/catalog-build-slugs.json");

try {
  const raw = execSync(
    'npx wrangler d1 execute humpbuck-site --remote --command "SELECT slug FROM CatalogProduct ORDER BY slug;" --json',
    { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  );
  const parsed = JSON.parse(raw);
  const rows = parsed?.[0]?.results ?? [];
  const slugs = rows
    .map((row) => (typeof row?.slug === "string" ? row.slug.trim() : ""))
    .filter(Boolean);
  if (slugs.length === 0) {
    console.warn("[export-catalog-slugs] Remote D1 returned no products; keeping existing file.");
    process.exit(0);
  }
  writeFileSync(out, `${JSON.stringify(slugs, null, 2)}\n`);
  console.log(`[export-catalog-slugs] Wrote ${slugs.length} slug(s) to scripts/catalog-build-slugs.json`);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.warn(
    `[export-catalog-slugs] Remote D1 unavailable; using committed scripts/catalog-build-slugs.json (${message})`,
  );
}
