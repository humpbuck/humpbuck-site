-- Homepage customer certainty section (admin-editable extras)
ALTER TABLE "SiteHomeContent" ADD COLUMN "certaintyHeading" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteHomeContent" ADD COLUMN "certaintyLead" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteHomeContent" ADD COLUMN "certaintyExtraBlocks" TEXT NOT NULL DEFAULT '';
