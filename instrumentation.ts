/**
 * Runs once before the Next.js server handles requests (nodejs runtime only).
 * Re-applies `.env.local` DB overrides after OpenNext wrangler init in `next.config.ts`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { applyLocalDatabaseEnvOverride } = await import("./scripts/load-project-env.mjs");
  applyLocalDatabaseEnvOverride();

  const globalForPrisma = globalThis as { prisma?: unknown };
  delete globalForPrisma.prisma;
}
