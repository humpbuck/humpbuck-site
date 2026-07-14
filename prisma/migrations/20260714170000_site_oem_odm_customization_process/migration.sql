-- Customization Process section (heading + body text)
ALTER TABLE "SiteOemOdmContent" ADD COLUMN "customizationProcessHeading" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteOemOdmContent" ADD COLUMN "customizationProcessText" TEXT NOT NULL DEFAULT '';
