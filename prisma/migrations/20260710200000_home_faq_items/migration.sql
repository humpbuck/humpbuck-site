-- Homepage FAQ: three editable question/answer pairs
ALTER TABLE "SiteHomeContent" ADD COLUMN "faqItem1Question" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteHomeContent" ADD COLUMN "faqItem1Answer" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteHomeContent" ADD COLUMN "faqItem2Question" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteHomeContent" ADD COLUMN "faqItem2Answer" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteHomeContent" ADD COLUMN "faqItem3Question" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteHomeContent" ADD COLUMN "faqItem3Answer" TEXT NOT NULL DEFAULT '';
