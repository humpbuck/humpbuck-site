import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ANNOUNCEMENT_BACKGROUND,
  normalizeAnnouncementBackgroundColor,
  normalizeAnnouncementSlides,
  parseAnnouncementSlidesJson,
  serializeAnnouncementSlides,
  type SaveSiteAnnouncementResult,
  type SiteAnnouncementData,
} from "@/lib/site-announcement";

const DEFAULT_ID = "default";

const EMPTY: SiteAnnouncementData = {
  enabled: false,
  slides: [],
  backgroundColor: DEFAULT_ANNOUNCEMENT_BACKGROUND,
};

type AnnouncementRow = {
  enabled: boolean;
  message: string;
  href: string;
  slidesJson?: string | null;
  backgroundColor?: string | null;
  updatedAt: Date;
};

function isSlidesJsonUnsupportedError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientValidationError &&
    error.message.includes("slidesJson")
  );
}

function isBackgroundColorUnsupportedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message;
  return (
    (error instanceof Prisma.PrismaClientValidationError &&
      message.includes("backgroundColor")) ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      (message.includes("backgroundColor") ||
        message.includes("BackgroundColor")))
  );
}

async function loadSiteAnnouncementUncached(): Promise<SiteAnnouncementData> {
  if (!prisma.siteAnnouncement) return EMPTY;

  const row = (await prisma.siteAnnouncement
    .findUnique({ where: { id: DEFAULT_ID } })
    .catch(() => null)) as AnnouncementRow | null;
  if (!row) {
    return EMPTY;
  }

  const slides = parseAnnouncementSlidesJson(row.slidesJson, {
    message: row.message,
    href: row.href,
  });

  return {
    enabled: row.enabled,
    slides,
    backgroundColor:
      normalizeAnnouncementBackgroundColor(row.backgroundColor) ??
      DEFAULT_ANNOUNCEMENT_BACKGROUND,
  };
}

/** Cached for all storefront layouts; admin save calls `revalidateSiteAnnouncement()`. */
export async function getSiteAnnouncement(): Promise<SiteAnnouncementData> {
  return unstable_cache(
    loadSiteAnnouncementUncached,
    ["site-announcement"],
    {
      tags: ["site-announcement"],
    },
  )();
}

/** Admin editor — always read fresh from DB (never `unstable_cache`). */
export async function getSiteAnnouncementForAdmin(): Promise<{
  announcement: SiteAnnouncementData;
  updatedAt: string | null;
}> {
  if (!prisma.siteAnnouncement) {
    return { announcement: EMPTY, updatedAt: null };
  }

  const row = (await prisma.siteAnnouncement
    .findUnique({ where: { id: DEFAULT_ID } })
    .catch(() => null)) as AnnouncementRow | null;

  if (!row) {
    return { announcement: EMPTY, updatedAt: null };
  }

  const slides = parseAnnouncementSlidesJson(row.slidesJson, {
    message: row.message,
    href: row.href,
  });

  return {
    announcement: {
      enabled: row.enabled,
      slides,
      backgroundColor:
        normalizeAnnouncementBackgroundColor(row.backgroundColor) ??
        DEFAULT_ANNOUNCEMENT_BACKGROUND,
    },
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function saveSiteAnnouncement(
  data: SiteAnnouncementData,
): Promise<SaveSiteAnnouncementResult> {
  if (!prisma.siteAnnouncement) {
    throw new Error(
      "Prisma client is missing SiteAnnouncement. Run `npm run db:migrate`, `npx prisma generate`, then restart dev.",
    );
  }

  const slides = normalizeAnnouncementSlides(data.slides);
  const slidesJson = serializeAnnouncementSlides(slides);
  const first = slides[0];

  const base = {
    enabled: data.enabled,
    message: first?.message ?? "",
    href: first?.href ?? "",
    slidesJson,
  };

  try {
    await prisma.siteAnnouncement.upsert({
      where: { id: DEFAULT_ID },
      create: {
        id: DEFAULT_ID,
        ...base,
        backgroundColor: data.backgroundColor,
      },
      update: {
        ...base,
        backgroundColor: data.backgroundColor,
      },
    });
    return { colorSaved: true };
  } catch (error) {
    if (isSlidesJsonUnsupportedError(error)) {
      throw new Error(
        "Prisma client is out of date. Stop the dev server, run `npx prisma generate`, then restart dev.",
      );
    }
    if (!isBackgroundColorUnsupportedError(error)) throw error;

    await prisma.siteAnnouncement.upsert({
      where: { id: DEFAULT_ID },
      create: {
        id: DEFAULT_ID,
        ...base,
      },
      update: base,
    });
    return { colorSaved: false };
  }
}
