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

/** Local dev: clear stale `CF_WORKERS_BUILD=1` from Windows env when using `.env.local`. */
export function applyLocalDatabaseEnvOverride() {
  loadProjectEnv();
  if (process.env.CF_WORKERS_BUILD === "1" && process.env.NODE_ENV !== "production") {
    delete process.env.CF_WORKERS_BUILD;
  }
  if (!process.env.DATABASE_URL?.trim()) {
    process.env.DATABASE_URL = "file:./dev.db";
  }
}
