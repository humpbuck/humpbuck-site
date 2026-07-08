import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

const SLUGS_PATH = join(process.cwd(), "scripts/catalog-build-slugs.json");

/** Fallback when `next build` / cf-build has no D1 binding (OpenNext on Cloudflare). */
export function readCatalogBuildSlugs(): string[] {
  try {
    const raw = readFileSync(SLUGS_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return [
      ...new Set(
        parsed
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .map((s) => s.trim()),
      ),
    ];
  } catch {
    return [];
  }
}
