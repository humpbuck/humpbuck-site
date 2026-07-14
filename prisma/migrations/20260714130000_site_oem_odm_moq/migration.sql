-- Add MOQ table rows (JSON array) to SiteOemOdmContent
ALTER TABLE "SiteOemOdmContent" ADD COLUMN "moqRowsJson" TEXT NOT NULL DEFAULT '';
