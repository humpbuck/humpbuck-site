-- Sample Policy: plain text column (replaces structured samplePolicyJson)
ALTER TABLE "SiteOemOdmContent" RENAME COLUMN "samplePolicyJson" TO "samplePolicyText";
