-- Separate product spotlight backgrounds for desktop (PC) and mobile (APP).
ALTER TABLE "SiteHomeContent" ADD COLUMN "spotlightBackgroundMobileImageUrl" TEXT NOT NULL DEFAULT '';
