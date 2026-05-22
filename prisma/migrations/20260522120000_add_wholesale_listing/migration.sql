-- CreateTable
CREATE TABLE "WholesaleListing" (
    "id" TEXT NOT NULL,
    "modelNumber" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "priceUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mediaJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WholesaleListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WholesaleListing_status_sortOrder_idx" ON "WholesaleListing"("status", "sortOrder");
