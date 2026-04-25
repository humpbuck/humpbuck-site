-- AlterTable: add soft-delete, refund tracking to Order
ALTER TABLE "Order" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "refundReason" TEXT;
ALTER TABLE "Order" ADD COLUMN "refundAmountCents" INTEGER;
ALTER TABLE "Order" ADD COLUMN "refundedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Order_deletedAt_idx" ON "Order"("deletedAt");

-- CreateTable: ProductInventory
CREATE TABLE "ProductInventory" (
    "id" TEXT NOT NULL,
    "productSlug" TEXT NOT NULL,
    "variantId" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductInventory_productSlug_variantId_key" ON "ProductInventory"("productSlug", "variantId");
CREATE INDEX "ProductInventory_productSlug_idx" ON "ProductInventory"("productSlug");
