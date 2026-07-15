import fs from "node:fs";
import path from "node:path";

/** Turbopack may copy a stale @prisma/client into .next — remove after every generate. */
export function purgeNextPrismaCache(cwd = process.cwd()) {
  const targets = [
    path.join(cwd, ".next", "dev", "node_modules", "@prisma"),
    path.join(cwd, ".next", "dev", "node_modules", ".prisma"),
  ];

  for (const target of targets) {
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }
}
