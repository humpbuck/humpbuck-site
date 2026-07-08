import type { PrismaClient as PrismaClientType } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { withAccelerate } from "@prisma/extension-accelerate";

function isAccelerateDatabaseUrl(url: string): boolean {
  return url.startsWith("prisma://") || url.startsWith("prisma+postgres://");
}

function createPrismaClient(): PrismaClientType {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const log: ("error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  if (isAccelerateDatabaseUrl(connectionString)) {
    // Edge client + Accelerate: no local query compiler wasm (Cloudflare Workers).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("@prisma/client/edge") as typeof import("@prisma/client");
    return new PrismaClient({
      accelerateUrl: connectionString,
    } as ConstructorParameters<typeof PrismaClient>[0]).$extends(withAccelerate()) as unknown as PrismaClientType;
  }

  const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter, log });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientType | undefined };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
