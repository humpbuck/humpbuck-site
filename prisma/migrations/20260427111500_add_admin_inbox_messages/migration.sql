-- CreateTable
CREATE TABLE "AdminInboxMessage" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sourceEmail" TEXT,
    "payloadJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminInboxMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminInboxMessage_category_status_createdAt_idx" ON "AdminInboxMessage"("category", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AdminInboxMessage_status_createdAt_idx" ON "AdminInboxMessage"("status", "createdAt");
