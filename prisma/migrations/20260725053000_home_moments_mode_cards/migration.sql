-- Refresh homepage moments cards (Everyday / Adventure Mode)
UPDATE "SiteHomeContent"
SET
  "momentsCard1Title" = 'Everyday Mode',
  "momentsCard1Description" = 'Time, date, alarm, and dual time for the rhythm of daily life.',
  "momentsCard2Title" = 'Adventure Mode',
  "momentsCard2Description" = 'Stopwatch and dual time for travel, movement, and everything ahead.'
WHERE "id" = 'default'
  AND (
    "momentsCard1Title" = ''
    OR "momentsCard1Title" = 'Celebratory Moments'
    OR "momentsCard1Title" = 'Milestone Moments'
  );
