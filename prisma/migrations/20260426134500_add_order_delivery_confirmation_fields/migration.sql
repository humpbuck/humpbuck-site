-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "shippedAt" TIMESTAMP(3),
ADD COLUMN "deliveredAt" TIMESTAMP(3),
ADD COLUMN "deliveryConfirmedBy" TEXT;

-- CreateIndex
CREATE INDEX "Order_status_shippedAt_idx" ON "Order"("status", "shippedAt");

