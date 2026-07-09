import type { PrismaClient as PrismaClientType } from "@prisma/client";

/** Minimal D1 binding surface for `@prisma/adapter-d1` (full types via `npm run cf-typegen`). */
type D1DatabaseBinding = {
  prepare: (query: string) => unknown;
  batch?: (statements: unknown[]) => Promise<unknown[]>;
  exec?: (query: string) => Promise<unknown>;
};

const LOG: ("error" | "warn")[] =
  process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

function isD1Database(value: unknown): value is D1DatabaseBinding {
  return (
    typeof value === "object" &&
    value !== null &&
    "prepare" in value &&
    typeof (value as D1DatabaseBinding).prepare === "function"
  );
}

/** Cloudflare D1 binding from OpenNext (`wrangler.jsonc` → binding `DB`). */
export function tryGetCloudflareD1(): D1DatabaseBinding | null {
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

export function createD1PrismaClient(db: D1DatabaseBinding): PrismaClientType {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaD1 } = require("@prisma/adapter-d1") as typeof import("@prisma/adapter-d1");
  const adapter = new PrismaD1(db as ConstructorParameters<typeof PrismaD1>[0]);
  return new PrismaClient({ adapter, log: LOG });
}

export function createAppPrismaClient(): PrismaClientType {
  const d1 = tryGetCloudflareD1();
  if (d1) {
    return createD1PrismaClient(d1);
  }
  if (process.env.NODE_ENV === "development") {
    // `npm run dev` has no D1 binding — fall back to local SQLite (`prisma/dev.db`).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createLocalFilePrismaClient } =
      require("@/lib/prisma-local") as typeof import("@/lib/prisma-local");
    return createLocalFilePrismaClient();
  }
  throw new Error(
    "D1 binding `DB` is not available. Check wrangler.jsonc database_id and restart `npm run dev`.",
  );
}
