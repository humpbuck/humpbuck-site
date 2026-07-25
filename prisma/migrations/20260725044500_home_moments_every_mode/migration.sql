-- Refresh homepage moments heading/lead (ANA-DIGI mode positioning)
UPDATE "SiteHomeContent"
SET
  "momentsHeading" = 'Made for Every Mode',
  "momentsLead" = 'From everyday routines to new adventures, one watch keeps up with every moment.'
WHERE "id" = 'default'
  AND (
    "momentsHeading" = ''
    OR "momentsHeading" = 'Moments Worth Remembering'
  );
