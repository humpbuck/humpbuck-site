import type { PrismaClient as PrismaClientType } from "@prisma/client";

const LOG: ("error" | "warn")[] =
  process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

/** SQLite file for Prisma CLI + local scripts (relative to `prisma/schema.prisma`). */
export function resolveLocalDatabaseUrl(): string {
  return process.env.DATABASE_URL?.trim() || "file:./dev.db";
}

/** Local SQLite file — scripts only (`lib/prisma-script.ts`), never imported from app routes. */
export function createLocalFilePrismaClient(): PrismaClientType {
  const url = resolveLocalDatabaseUrl();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaLibSQL } =
    require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
  const adapter = new PrismaLibSQL({ url });
  return new PrismaClient({ adapter, log: LOG });
}
