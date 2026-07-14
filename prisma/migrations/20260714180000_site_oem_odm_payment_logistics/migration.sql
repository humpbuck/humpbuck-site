-- Payment Terms + Logistics & Shipping sections
ALTER TABLE "SiteOemOdmContent" ADD COLUMN "paymentTermsHeading" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteOemOdmContent" ADD COLUMN "paymentTermsText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteOemOdmContent" ADD COLUMN "logisticsShippingHeading" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteOemOdmContent" ADD COLUMN "logisticsShippingText" TEXT NOT NULL DEFAULT '';
