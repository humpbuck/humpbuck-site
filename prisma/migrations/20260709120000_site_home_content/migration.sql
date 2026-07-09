-- CreateTable
CREATE TABLE "SiteHomeContent" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "heroBadge" TEXT NOT NULL DEFAULT '',
    "heroTitle" TEXT NOT NULL DEFAULT '',
    "heroLead" TEXT NOT NULL DEFAULT '',
    "heroChip1" TEXT NOT NULL DEFAULT '',
    "heroChip2" TEXT NOT NULL DEFAULT '',
    "heroChip3" TEXT NOT NULL DEFAULT '',
    "heroCtaShop" TEXT NOT NULL DEFAULT '',
    "heroImageAlt" TEXT NOT NULL DEFAULT '',
    "heroDesktopImageUrl" TEXT NOT NULL DEFAULT '',
    "heroMobileImageUrl" TEXT NOT NULL DEFAULT '',
    "aboutHeading" TEXT NOT NULL DEFAULT '',
    "aboutParagraph1" TEXT NOT NULL DEFAULT '',
    "aboutParagraph2" TEXT NOT NULL DEFAULT '',
    "aboutImageAlt" TEXT NOT NULL DEFAULT '',
    "aboutImageUrl" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);

-- Seed homepage about copy (hero fields stay empty → built-in defaults until edited in admin).
INSERT INTO "SiteHomeContent" (
    "id",
    "aboutHeading",
    "aboutParagraph1",
    "aboutParagraph2",
    "updatedAt"
) VALUES (
    'default',
    'About',
    'I have loved mechanical watches since I was a child. Back then, my family was poor, and I couldn''t afford one. However, I was completely fascinated by how the intricate gears interlock and how the complex mechanical structures work together to keep precise time.',
    'Now, I have built this mechanical watch website. My goal is to offer high-quality, affordable mechanical watches to everyone, while fulfilling my childhood dream of owning one. Keep chasing your dreams.',
    CURRENT_TIMESTAMP
);
