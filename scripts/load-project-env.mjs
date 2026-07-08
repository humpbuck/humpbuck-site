import fs from "node:fs";
import path from "node:path";

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const eq = trimmed.indexOf("=");
  if (eq <= 0) return null;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return { key, value };
}

/** Force `.env.local` keys onto `process.env` (overrides Windows system vars). */
export function loadProjectEnv(cwd = process.cwd()) {
  const localPath = path.join(cwd, ".env.local");
  if (!fs.existsSync(localPath)) return;

  const text = fs.readFileSync(localPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (parsed) process.env[parsed.key] = parsed.value;
  }
}

/** Prefer Neon direct for local dev; Cloudflare build keeps Accelerate `DATABASE_URL`. */
export function applyLocalDatabaseEnvOverride() {
  loadProjectEnv();
  const direct = process.env.DIRECT_DATABASE_URL?.trim();
  if (!direct) return;
  // Local Neon dev — override system Accelerate `DATABASE_URL` and stale `CF_WORKERS_BUILD=1`.
  process.env.DATABASE_URL = direct;
  if (process.env.CF_WORKERS_BUILD === "1") {
    delete process.env.CF_WORKERS_BUILD;
  }
}
