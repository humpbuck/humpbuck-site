-- Homepage FAQ: JSON array for unlimited question/answer pairs
ALTER TABLE "SiteHomeContent" ADD COLUMN "faqItemsJson" TEXT NOT NULL DEFAULT '';
