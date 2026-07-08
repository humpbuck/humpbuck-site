import type { PrismaClient as PrismaClientType } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { isAccelerateDatabaseUrl, isCloudflareWorkersBuild, resolveDatabaseUrl } from "@/lib/database-url";

function createAccelerateClient(connectionString: string): PrismaClientType {
  // Edge client + Accelerate with --no-engine / engineType=client (no wasm in Worker bundle).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client/edge") as typeof import("@prisma/client");
  return new PrismaClient({
    datasourceUrl: connectionString,
  }).$extends(withAccelerate()) as unknown as PrismaClientType;
}

function createPrismaClient(): PrismaClientType {
  const direct = process.env.DIRECT_DATABASE_URL?.trim();
  if (direct && !isCloudflareWorkersBuild()) {
    process.env.DATABASE_URL = direct;
  }

  const connectionString = resolveDatabaseUrl();

  if (isAccelerateDatabaseUrl(connectionString)) {
    return createAccelerateClient(connectionString);
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createNeonPrismaClient } = require("@/lib/prisma-neon") as typeof import("@/lib/prisma-neon");
  return createNeonPrismaClient(connectionString);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientType | undefined };

function getPrismaClient(): PrismaClientType {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/** Lazy singleton — connects on first query after `next.config` applies `.env.local`. */
export const prisma: PrismaClientType = new Proxy({} as PrismaClientType, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client) as unknown;
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});
