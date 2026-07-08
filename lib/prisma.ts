import "server-only";

import { cache } from "react";
import type { PrismaClient as PrismaClientType } from "@prisma/client";
import { createAppPrismaClient } from "@/lib/prisma-d1";

const getRequestPrisma = cache((): PrismaClientType => createAppPrismaClient());

/** Lazy singleton — Cloudflare D1 via Worker binding `DB`. */
export const prisma: PrismaClientType = new Proxy({} as PrismaClientType, {
  get(_target, prop) {
    const client = getRequestPrisma();
    const value = Reflect.get(client, prop, client) as unknown;
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});
