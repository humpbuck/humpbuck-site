import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  applySiteHomeImageCacheRevision,
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
  const content = normalizeSiteHomeContent(row);
  return applySiteHomeImageCacheRevision(content, row.updatedAt.toISOString());
}

const HOME_CONTENT_REVALIDATE_SECONDS = 60;

const getCachedSiteHomeContent = unstable_cache(
  loadSiteHomeContentUncached,
  ["site-home-content"],
  {
    tags: ["site-home-content"],
    revalidate: HOME_CONTENT_REVALIDATE_SECONDS,
  },
);

/**
 * Homepage hero / about / spotlight / FAQ copy — shared data cache.
 * Admin save calls `revalidateStorefrontHomepage()`. Do not use `connection()`:
 * it forces the home route dynamic and burns Workers CPU on every visit.
 */
export const getSiteHomeContent = cache(async (): Promise<SiteHomeContentData> => {
  return getCachedSiteHomeContent();
});

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

  try {
    await prisma.siteHomeContent.upsert({
      where: { id: DEFAULT_ID },
      create: { id: DEFAULT_ID, ...normalized },
      update: normalized,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("Unknown argument") && /certainty|faqItem|faqItemsJson|moments/.test(msg)) {
      throw new Error(
        "Homepage fields are not loaded in this dev session. Run `npm run db:d1:local`, then `npx prisma generate`, restart `npm run dev`, and save again.",
      );
    }
    throw error;
  }
}
