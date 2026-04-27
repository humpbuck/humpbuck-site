-- CreateTable
CREATE TABLE "AdminInboxReadCursor" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminInboxReadCursor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminInboxReadCursor_category_key" ON "AdminInboxReadCursor"("category");
