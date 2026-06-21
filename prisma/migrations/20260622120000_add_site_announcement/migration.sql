-- CreateTable
CREATE TABLE "SiteAnnouncement" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL DEFAULT '',
    "href" TEXT NOT NULL DEFAULT '',
    "slidesJson" TEXT NOT NULL DEFAULT '[]',
    "backgroundColor" TEXT NOT NULL DEFAULT '#0f1114',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteAnnouncement_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SiteAnnouncement" ("id", "enabled", "message", "href", "slidesJson", "backgroundColor", "updatedAt")
VALUES ('default', false, '', '', '[]', '#0f1114', CURRENT_TIMESTAMP);
