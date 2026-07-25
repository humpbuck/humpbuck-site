-- Refresh default announcement slide to ANA-DIGI positioning
UPDATE "SiteAnnouncement"
SET "slidesJson" = '[{"message":"ANA-DIGI TEMP multifunctional watches for everyday wear.","href":""}]'
WHERE "id" = 'default'
  AND (
    "slidesJson" LIKE '%meaningful moments%'
    OR "slidesJson" LIKE '%Meaningful Moments%'
  );
