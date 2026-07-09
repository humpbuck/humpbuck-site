import { unstable_cache } from "next/cache";
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

/** Cached for homepage hero/about; admin save calls `revalidateSiteHomeContent()`. */
export async function getSiteHomeContent(): Promise<SiteHomeContentData> {
  return unstable_cache(
    loadSiteHomeContentUncached,
    ["site-home-content"],
    { tags: ["site-home-content"] },
  )();
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
