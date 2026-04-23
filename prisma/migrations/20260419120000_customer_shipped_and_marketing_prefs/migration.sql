-- AlterTable
ALTER TABLE "Order" ADD COLUMN "customerShippedEmailSentAt" DATETIME;

-- CreateTable
CREATE TABLE "EmailMarketingPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "unsubscribeToken" TEXT NOT NULL,
    "marketingOptOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "EmailMarketingPreference_email_key" ON "EmailMarketingPreference"("email");
CREATE UNIQUE INDEX "EmailMarketingPreference_unsubscribeToken_key" ON "EmailMarketingPreference"("unsubscribeToken");
