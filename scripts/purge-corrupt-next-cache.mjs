/**
 * Windows / Turbopack can bake an absolute path with the wrong drive letter into
 * `.next` (seen as `H:\MY-STORES\humpbuck-site` while the repo lives on `D:\`).
 * That makes module resolution thrash and Next can pin many GB of RAM / spin fans.
 *
 * Call from `npm run dev` before starting Next. Safe no-op when cache is healthy.
 */
import fs from "node:fs";
import path from "node:path";

const PROJECT_TAIL = path.join("MY-STORES", "humpbuck-site");

function projectDriveRoot(projectRoot) {
  return path.parse(path.resolve(projectRoot)).root.toUpperCase();
}

function removeIfEmpty(dir) {
  try {
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
    }
  } catch {
    // ignore
  }
}

/** Ghost trees Next created on the wrong drive (e.g. H:\MY-STORES\humpbuck-site). */
function removeWrongDriveGhosts(projectRoot) {
  const selfDrive = projectDriveRoot(projectRoot);
  let removed = false;
  for (const code of "CDEFGHIJKLMNOPQRSTUVWXYZ") {
    const root = `${code}:\\`;
    if (root === selfDrive) continue;
    const ghost = path.join(root, PROJECT_TAIL);
    if (!fs.existsSync(ghost)) continue;
    console.warn(
      `[dev] Removing ghost path ${ghost} (repo is on ${selfDrive.replace(/\\$/, "")}).`,
    );
    fs.rmSync(ghost, { recursive: true, force: true });
    removeIfEmpty(path.join(root, "MY-STORES"));
    removed = true;
  }
  return removed;
}

/** True when a compiled chunk embeds __NEXT_DIST_DIR on another drive. */
function nextCacheHasWrongDrive(projectRoot) {
  const chunksDir = path.join(projectRoot, ".next", "dev", "static", "chunks");
  if (!fs.existsSync(chunksDir)) return false;
  const selfDriveLetter = projectDriveRoot(projectRoot).charAt(0);
  // File text looks like: "__NEXT_DIST_DIR":"H:\\MY-STORES\\..."
  const re = /__NEXT_DIST_DIR":"([A-Za-z]):\\\\/;
  let scanned = 0;
  for (const name of fs.readdirSync(chunksDir)) {
    if (!name.endsWith(".js")) continue;
    scanned += 1;
    if (scanned > 40) break;
    const sample = fs.readFileSync(path.join(chunksDir, name), "utf8");
    const m = sample.match(re);
    if (!m) continue;
    if (m[1].toUpperCase() !== selfDriveLetter) {
      return true;
    }
  }
  return false;
}

export function purgeCorruptNextCache(projectRoot = process.cwd()) {
  const root = path.resolve(projectRoot);
  const ghostRemoved = removeWrongDriveGhosts(root);
  const badDistDir = nextCacheHasWrongDrive(root);
  if (!ghostRemoved && !badDistDir) return false;

  const nextDir = path.join(root, ".next");
  if (fs.existsSync(nextDir)) {
    console.warn(
      "[dev] Clearing .next — Turbopack cache referenced a wrong Windows drive letter (can pin CPU/RAM).",
    );
    fs.rmSync(nextDir, { recursive: true, force: true });
  }
  return true;
}
