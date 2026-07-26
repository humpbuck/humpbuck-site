-- CreateTable
CREATE TABLE "SiteVideoTutorial" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "title" TEXT NOT NULL DEFAULT '',
    "r2VideoUrl" TEXT NOT NULL DEFAULT '',
    "youtubeUrl" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
