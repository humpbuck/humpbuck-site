-- Run once on production D1 (Cloudflare dashboard → D1 → humpbuck-site → Console)
-- Safe to re-run: skip statements that already exist.

CREATE TABLE IF NOT EXISTS "ShippingFeeRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL DEFAULT '',
    "shippingFeeCents" INTEGER NOT NULL DEFAULT 0,
    "surchargeCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ShippingFeeRate_countryCode_key" ON "ShippingFeeRate"("countryCode");

-- If table existed without deliveryDaysLabel, run ALTER only (ignore duplicate column error):
ALTER TABLE "ShippingFeeRate" ADD COLUMN "deliveryDaysLabel" TEXT NOT NULL DEFAULT '7-14 Business Days';

CREATE TABLE IF NOT EXISTS "ShippingExpressMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodId" TEXT NOT NULL,
    "feeCents" INTEGER NOT NULL DEFAULT 0,
    "deliveryDaysLabel" TEXT NOT NULL DEFAULT '3-5 Business Days',
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ShippingExpressMethod_methodId_key" ON "ShippingExpressMethod"("methodId");

INSERT OR IGNORE INTO "ShippingExpressMethod" ("id", "methodId", "feeCents", "deliveryDaysLabel", "updatedAt")
VALUES
  ('seed-express-dhl', 'dhl', 0, '3-5 Business Days', CURRENT_TIMESTAMP),
  ('seed-express-fedex', 'fedex', 0, '3-5 Business Days', CURRENT_TIMESTAMP),
  ('seed-express-ups', 'ups', 0, '3-5 Business Days', CURRENT_TIMESTAMP);
