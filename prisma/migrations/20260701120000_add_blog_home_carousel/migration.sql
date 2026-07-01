ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "homeCarouselSlot" INTEGER;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "homeCarouselImageUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "homeCarouselDescription" TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS "BlogPost_homeCarouselSlot_idx" ON "BlogPost"("homeCarouselSlot");
