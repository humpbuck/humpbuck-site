-- One review per delivered order line (repeat purchases can review again).
DROP INDEX "ProductReview_userId_productSlug_key";

CREATE UNIQUE INDEX "ProductReview_userId_orderId_productSlug_key" ON "ProductReview"("userId", "orderId", "productSlug");
