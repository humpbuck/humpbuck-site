-- Add Sample Policy section (JSON) to SiteOemOdmContent
ALTER TABLE "SiteOemOdmContent" ADD COLUMN "samplePolicyJson" TEXT NOT NULL DEFAULT '';
