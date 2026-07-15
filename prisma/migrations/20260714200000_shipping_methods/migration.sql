-- AlterTable
ALTER TABLE "ShippingFeeRate" ADD COLUMN "deliveryDaysLabel" TEXT NOT NULL DEFAULT '7-14 Business Days';

-- CreateTable
CREATE TABLE "ShippingExpressMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "methodId" TEXT NOT NULL,
    "feeCents" INTEGER NOT NULL DEFAULT 0,
    "deliveryDaysLabel" TEXT NOT NULL DEFAULT '3-5 Business Days',
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingExpressMethod_methodId_key" ON "ShippingExpressMethod"("methodId");

-- Seed express methods
INSERT INTO "ShippingExpressMethod" ("id", "methodId", "feeCents", "deliveryDaysLabel", "updatedAt")
VALUES
  ('seed-express-dhl', 'dhl', 0, '3-5 Business Days', CURRENT_TIMESTAMP),
  ('seed-express-fedex', 'fedex', 0, '3-5 Business Days', CURRENT_TIMESTAMP),
  ('seed-express-ups', 'ups', 0, '3-5 Business Days', CURRENT_TIMESTAMP);
