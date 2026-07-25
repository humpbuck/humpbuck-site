-- Everyday Mode card images (PC + APP)
UPDATE "SiteHomeContent"
SET
  "momentsCard1DesktopImageUrl" = 'https://assets.humpbuck.com/Home/section2/Everyday-Mode-PC.webp',
  "momentsCard1MobileImageUrl" = 'https://assets.humpbuck.com/Home/section2/Everyday-Mode-APP.webp'
WHERE "id" = 'default';
