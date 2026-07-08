import type { PrismaClient as PrismaClientType } from "@prisma/client";

export function createNeonPrismaClient(connectionString: string): PrismaClientType {
  const log: ("error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaNeon } = require("@prisma/adapter-neon") as typeof import("@prisma/adapter-neon");
  const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter, log });
}
