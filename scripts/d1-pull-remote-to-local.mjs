/**
 * Export production Cloudflare D1 and load into local prisma/dev.db
 * so `npm run dev` (without HUMPBUCK_D1_REMOTE) matches online catalog/homepage CMS.
 *
 * Requires: `npx wrangler login` and network access to Cloudflare API.
 *
 * Usage: npm run db:d1:pull
 *
 * Prefer live dev against prod data: set HUMPBUCK_D1_REMOTE=1 in `.env.local` instead.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbName = "humpbuck-site";
const exportSql = path.join(root, ".tmp", "d1-remote-export.sql");
const localDb = path.join(root, "prisma", "dev.db");

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    encoding: "utf-8",
    shell: true,
    cwd: root,
  });
  const out = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  if (result.status !== 0) {
    if (out) console.error(out);
    process.exit(result.status ?? 1);
  }
  return out;
}

fs.mkdirSync(path.dirname(exportSql), { recursive: true });

console.log(`Exporting remote D1 "${dbName}"…`);
run("npx", [
  "wrangler",
  "d1",
  "export",
  dbName,
  "--remote",
  "--output",
  exportSql,
  "-y",
]);

if (fs.existsSync(localDb)) {
  const backup = `${localDb}.bak-${Date.now()}`;
  fs.copyFileSync(localDb, backup);
  console.log(`Backed up → ${path.relative(root, backup)}`);
  fs.unlinkSync(localDb);
}

const sql = fs.readFileSync(exportSql, "utf8");
const statements = sql
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("--"));

const client = createClient({ url: `file:${localDb}` });
console.log(`Importing ${statements.length} SQL statements into prisma/dev.db…`);

(async () => {
  for (const statement of statements) {
    try {
      await client.execute(statement);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/already exists|duplicate column|UNIQUE constraint failed/i.test(msg)) continue;
      console.error(`Failed statement:\n${statement.slice(0, 200)}…\n${msg}`);
      process.exit(1);
    }
  }
  client.close();
  console.log("\nDone. Keep DATABASE_URL=file:./dev.db and restart npm run dev.");
  console.log("Or set HUMPBUCK_D1_REMOTE=1 in .env.local to read live production D1.");
})();
