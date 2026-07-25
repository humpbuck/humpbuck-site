-- Refresh homepage hero badge to ANA-DIGI positioning
UPDATE "SiteHomeContent"
SET "heroBadge" = 'ANA-DIGI · TEMP'
WHERE "id" = 'default'
  AND (
    "heroBadge" = ''
    OR "heroBadge" = 'Gifts · Time & Love'
  );
