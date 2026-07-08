import type { PrismaClient as PrismaClientType } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

function isAccelerateDatabaseUrl(url: string): boolean {
  return url.startsWith("prisma://") || url.startsWith("prisma+postgres://");
}

function createAccelerateClient(connectionString: string): PrismaClientType {
  // Edge client + Accelerate with --no-engine / engineType=client (no wasm in Worker bundle).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client/edge") as typeof import("@prisma/client");
  return new PrismaClient({
    datasourceUrl: connectionString,
  }).$extends(withAccelerate()) as unknown as PrismaClientType;
}

function createPrismaClient(): PrismaClientType {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  if (isAccelerateDatabaseUrl(connectionString)) {
    return createAccelerateClient(connectionString);
  }

  // CF build uses `prisma generate --no-engine`; Neon adapter is incompatible with that client.
  if (process.env.CF_WORKERS_BUILD === "1") {
    throw new Error(
      "Cloudflare build requires DATABASE_URL to be a Prisma Accelerate URL (prisma://...). " +
        "Set it in Cloudflare Build variables, not only Runtime variables.",
    );
  }

  const log: ("error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaNeon } = require("@prisma/adapter-neon") as typeof import("@prisma/adapter-neon");
  const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter, log });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientType | undefined };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
