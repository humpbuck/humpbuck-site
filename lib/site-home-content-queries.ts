import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  EMPTY_SITE_HOME_CONTENT,
  normalizeSiteHomeContent,
  type SiteHomeContentData,
} from "@/lib/site-home-content";

const DEFAULT_ID = "default";

async function loadSiteHomeContentUncached(): Promise<SiteHomeContentData> {
  if (!prisma.siteHomeContent) return EMPTY_SITE_HOME_CONTENT;

  const row = await prisma.siteHomeContent
    .findUnique({ where: { id: DEFAULT_ID } })
    .catch(() => null);

  if (!row) return EMPTY_SITE_HOME_CONTENT;
  return normalizeSiteHomeContent(row);
}

/**
 * Homepage hero / about / spotlight / coupon copy — always read D1 on request.
 * `unstable_cache` + `revalidateTag` do not reliably bust on Cloudflare OpenNext;
 * `connection()` opts these segments out of static prerender so admin saves show immediately.
 */
export async function getSiteHomeContent(): Promise<SiteHomeContentData> {
  await connection();
  return loadSiteHomeContentUncached();
}

/** Admin editor — always read fresh from DB (never `unstable_cache`). */
export async function getSiteHomeContentForAdmin(): Promise<{
  content: SiteHomeContentData;
  updatedAt: string | null;
}> {
  if (!prisma.siteHomeContent) {
    return { content: EMPTY_SITE_HOME_CONTENT, updatedAt: null };
  }

  const row = await prisma.siteHomeContent
    .findUnique({ where: { id: DEFAULT_ID } })
    .catch(() => null);

  if (!row) {
    return { content: EMPTY_SITE_HOME_CONTENT, updatedAt: null };
  }

  return {
    content: normalizeSiteHomeContent(row),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function saveSiteHomeContent(
  data: SiteHomeContentData,
): Promise<void> {
  if (!prisma.siteHomeContent) {
    throw new Error(
      "Prisma client is missing SiteHomeContent. Run `npm run db:migrate`, `npx prisma generate`, then restart dev.",
    );
  }

  const normalized = normalizeSiteHomeContent(data);

  await prisma.siteHomeContent.upsert({
    where: { id: DEFAULT_ID },
    create: { id: DEFAULT_ID, ...normalized },
    update: normalized,
  });
}
