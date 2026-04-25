-- AlterTable
ALTER TABLE "VisitorSession"
ADD COLUMN "country" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "deviceType" TEXT,
ADD COLUMN "browser" TEXT,
ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "VisitorSession_lastSeenAt_idx" ON "VisitorSession"("lastSeenAt");

-- CreateIndex
CREATE INDEX "VisitorSession_country_idx" ON "VisitorSession"("country");

-- CreateIndex
CREATE INDEX "VisitorSession_city_idx" ON "VisitorSession"("city");

-- CreateIndex
CREATE INDEX "VisitorSession_deviceType_idx" ON "VisitorSession"("deviceType");

-- CreateIndex
CREATE INDEX "VisitorSession_browser_idx" ON "VisitorSession"("browser");
