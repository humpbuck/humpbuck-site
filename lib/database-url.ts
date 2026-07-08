/** Prisma Accelerate connection string (Cloudflare Workers / edge). */
export function isAccelerateDatabaseUrl(url: string): boolean {
  return url.startsWith("prisma://") || url.startsWith("prisma+postgres://");
}

/**
 * True only for OpenNext Cloudflare bundle builds (`npm run cf-build`), not local `next dev`.
 * Windows often has stale `CF_WORKERS_BUILD=1` from deployment tests — ignore when
 * `.env.local` defines `DIRECT_DATABASE_URL` for Neon.
 */
export function isCloudflareWorkersBuild(): boolean {
  if (process.env.CF_WORKERS_BUILD !== "1") return false;
  if (process.env.DIRECT_DATABASE_URL?.trim()) return false;
  return true;
}

/**
 * Runtime database URL.
 * - Cloudflare build: `DATABASE_URL` must be Accelerate.
 * - Local dev: `DIRECT_DATABASE_URL` from `.env.local` wins over a system-wide `DATABASE_URL`
 *   (common when Accelerate is set in Windows env vars for deployment).
 */
export function resolveDatabaseUrl(): string {
  if (isCloudflareWorkersBuild()) {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    if (!isAccelerateDatabaseUrl(url)) {
      throw new Error(
        "Cloudflare build requires DATABASE_URL to be a Prisma Accelerate URL (prisma://...). " +
          "Set it in Cloudflare Build variables, not only Runtime variables.",
      );
    }
    return url;
  }

  const direct = process.env.DIRECT_DATABASE_URL?.trim();
  if (direct) return direct;

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. For local dev, add DIRECT_DATABASE_URL (Neon postgresql://...) to .env.local.",
    );
  }
  return url;
}

/** URL used by `prisma generate` to pick --no-engine vs full client. */
export function resolvePrismaGenerateDatabaseUrl(): string {
  if (isCloudflareWorkersBuild()) {
    return process.env.DATABASE_URL?.trim() ?? "";
  }
  return process.env.DIRECT_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim() || "";
}
