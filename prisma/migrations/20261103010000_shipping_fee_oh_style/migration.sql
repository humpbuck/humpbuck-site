-- WatchSourceGo-style wholesale rates: ¥/kg + 派送费 + 税费%.
-- Legacy shippingFeeCents / surchargeCents columns remain for older D1 rows.
ALTER TABLE "ShippingFeeRate" ADD COLUMN "pricePerKg" REAL NOT NULL DEFAULT 150;
ALTER TABLE "ShippingFeeRate" ADD COLUMN "deliveryFee" REAL NOT NULL DEFAULT 40;
ALTER TABLE "ShippingFeeRate" ADD COLUMN "dutyPercent" REAL NOT NULL DEFAULT 4;
