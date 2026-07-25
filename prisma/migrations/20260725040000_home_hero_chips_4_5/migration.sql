-- AlterTable
ALTER TABLE "SiteHomeContent" ADD COLUMN "heroChip4" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteHomeContent" ADD COLUMN "heroChip5" TEXT NOT NULL DEFAULT '';

-- One-time hero copy refresh (ana-digi positioning)
UPDATE "SiteHomeContent"
SET
  "heroTitle" = 'ANA-DIGI Temperature',
  "heroLead" = 'Retro ana-digi watches blending analog precision, digital functions, and futuristic design.',
  "heroChip1" = 'TIME',
  "heroChip2" = 'DATE',
  "heroChip3" = 'ALM',
  "heroChip4" = 'DU.T',
  "heroChip5" = 'ST.W'
WHERE "id" = 'default';
