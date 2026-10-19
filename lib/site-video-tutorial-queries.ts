import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const DEFAULT_ID = "default";

export type SiteVideoTutorialData = {
  title: string;
  r2VideoUrl: string;
  youtubeUrl: string;
};

const EMPTY: SiteVideoTutorialData = {
  title: "",
  r2VideoUrl: "",
  youtubeUrl: "",
};

async function ensureSiteVideoTutorialTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SiteVideoTutorial" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
      "title" TEXT NOT NULL DEFAULT '',
      "r2VideoUrl" TEXT NOT NULL DEFAULT '',
      "youtubeUrl" TEXT NOT NULL DEFAULT '',
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function loadUncached(): Promise<SiteVideoTutorialData> {
  try {
    await ensureSiteVideoTutorialTable();
  } catch {
    // table may already exist via Prisma migrate
  }

  if (!prisma.siteVideoTutorial) return EMPTY;

  const row = await prisma.siteVideoTutorial
    .findUnique({ where: { id: DEFAULT_ID } })
    .catch(() => null);
  if (!row) return EMPTY;

  return {
    title: row.title.trim(),
    r2VideoUrl: row.r2VideoUrl.trim(),
    youtubeUrl: row.youtubeUrl.trim(),
  };
}

const VIDEO_TUTORIAL_REVALIDATE_SECONDS = 60;

const getCachedSiteVideoTutorial = unstable_cache(
  loadUncached,
  ["site-video-tutorial"],
  {
    tags: ["site-video-tutorial"],
    revalidate: VIDEO_TUTORIAL_REVALIDATE_SECONDS,
  },
);

/** Storefront video tutorial page — shared data cache (same pattern as announcement). */
export const getSiteVideoTutorial = cache(
  async (): Promise<SiteVideoTutorialData> => {
    return getCachedSiteVideoTutorial();
  },
);

export async function getSiteVideoTutorialForAdmin(): Promise<{
  content: SiteVideoTutorialData;
  updatedAt: Date | null;
}> {
  try {
    await ensureSiteVideoTutorialTable();
  } catch {
    // ignore
  }

  if (!prisma.siteVideoTutorial) {
    return { content: EMPTY, updatedAt: null };
  }

  const row = await prisma.siteVideoTutorial
    .findUnique({ where: { id: DEFAULT_ID } })
    .catch(() => null);
  if (!row) return { content: EMPTY, updatedAt: null };

  return {
    content: {
      title: row.title,
      r2VideoUrl: row.r2VideoUrl,
      youtubeUrl: row.youtubeUrl,
    },
    updatedAt: row.updatedAt,
  };
}

export async function saveSiteVideoTutorial(input: {
  title: string;
  r2VideoUrl: string;
  youtubeUrl: string;
}): Promise<SiteVideoTutorialData> {
  await ensureSiteVideoTutorialTable();

  const title = input.title.trim();
  const r2VideoUrl = input.r2VideoUrl.trim();
  const youtubeUrl = input.youtubeUrl.trim();

  const row = await prisma.siteVideoTutorial.upsert({
    where: { id: DEFAULT_ID },
    create: {
      id: DEFAULT_ID,
      title,
      r2VideoUrl,
      youtubeUrl,
    },
    update: {
      title,
      r2VideoUrl,
      youtubeUrl,
    },
  });

  return {
    title: row.title,
    r2VideoUrl: row.r2VideoUrl,
    youtubeUrl: row.youtubeUrl,
  };
}
