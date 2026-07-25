import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { purgeCorruptNextCache } from "./purge-corrupt-next-cache.mjs";

const cwd = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = path.join(cwd, ".tmp", "purge-cache-selftest");
fs.mkdirSync(path.join(tmp, ".next", "dev", "static", "chunks"), {
  recursive: true,
});
fs.writeFileSync(
  path.join(tmp, ".next", "dev", "static", "chunks", "probe.js"),
  '{"__NEXT_DIST_DIR":"H:\\\\MY-STORES\\\\humpbuck-site\\\\.next\\\\dev"}',
);

const cleared = purgeCorruptNextCache(tmp);
const nextGone = !fs.existsSync(path.join(tmp, ".next"));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(JSON.stringify({ cleared, nextGone }));
if (!cleared || !nextGone) process.exit(1);
