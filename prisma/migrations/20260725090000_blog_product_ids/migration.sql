-- Related CatalogProduct ids for blog posts (JSON string array).
ALTER TABLE "BlogPost" ADD COLUMN "productIdsJson" TEXT NOT NULL DEFAULT '[]';
