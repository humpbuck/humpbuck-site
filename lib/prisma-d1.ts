import type { PrismaClient as PrismaClientType } from "@prisma/client";

const LOG: ("error" | "warn")[] =
  process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

function isD1Database(value: unknown): value is D1Database {
  return (
    typeof value === "object" &&
    value !== null &&
    "prepare" in value &&
    typeof (value as D1Database).prepare === "function"
  );
}

/** Cloudflare D1 binding from OpenNext (`wrangler.jsonc` → binding `DB`). */
export function tryGetCloudflareD1(): D1Database | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } =
      require("@opennextjs/cloudflare") as typeof import("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    const db = ctx?.env?.DB;
    return isD1Database(db) ? db : null;
  } catch {
    return null;
  }
}

export function createD1PrismaClient(db: D1Database): PrismaClientType {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaD1 } = require("@prisma/adapter-d1") as typeof import("@prisma/adapter-d1");
  const adapter = new PrismaD1(db);
  return new PrismaClient({ adapter, log: LOG });
}

export function createAppPrismaClient(): PrismaClientType {
  const d1 = tryGetCloudflareD1();
  if (!d1) {
    throw new Error(
      "D1 binding `DB` is not available. Check wrangler.jsonc database_id and restart `npm run dev`.",
    );
  }
  return createD1PrismaClient(d1);
}
