-- CreateTable
CREATE TABLE "SiteOemOdmContent" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "promoVideoUrl" TEXT NOT NULL DEFAULT '',
    "bodyText" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "SiteOemOdmContent" ("id", "updatedAt") VALUES ('default', CURRENT_TIMESTAMP);
