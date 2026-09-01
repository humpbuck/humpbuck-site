-- Canonicalize fixed watch collections to cat_{slug} ids.
-- CatalogProduct.categoryId FK → ProductCategory(id) ON UPDATE CASCADE / ON DELETE SET NULL.
-- Final ids: cat_ana-digi, cat_digital, cat_analog, cat_automatic

PRAGMA foreign_keys = ON;

-- ---------- ANA-DIGI (legacy cat_quartz) ----------
UPDATE "ProductCategory"
SET "id" = 'cat_ana-digi', "name" = 'ANA-DIGI', "slug" = 'ana-digi', "sortOrder" = 4
WHERE "id" = (
  SELECT "id" FROM "ProductCategory"
  WHERE "id" != 'cat_ana-digi'
    AND (
      "id" = 'cat_quartz'
      OR lower("slug") IN ('ana-digi', 'quartz', 'digitemp', 'digi-temp')
    )
    AND NOT EXISTS (SELECT 1 FROM "ProductCategory" WHERE "id" = 'cat_ana-digi')
  ORDER BY CASE WHEN "id" = 'cat_quartz' THEN 0 ELSE 1 END
  LIMIT 1
);

INSERT OR IGNORE INTO "ProductCategory" ("id", "name", "slug", "sortOrder", "createdAt")
VALUES ('cat_ana-digi', 'ANA-DIGI', 'ana-digi', 4, CURRENT_TIMESTAMP);

UPDATE "ProductCategory"
SET "slug" = printf('ana-digi__legacy_%s', substr("id", -6))
WHERE "id" != 'cat_ana-digi'
  AND lower("slug") IN ('ana-digi', 'quartz', 'digitemp', 'digi-temp');

UPDATE "CatalogProduct"
SET "categoryId" = 'cat_ana-digi',
    "categoryLabel" = 'ANA-DIGI',
    "storefrontCategory" = 'quartz',
    "storefrontSubcategory" = NULL,
    "storefrontSeries" = NULL
WHERE coalesce("categoryId", '') IN (
  SELECT "id" FROM "ProductCategory"
  WHERE "id" != 'cat_ana-digi'
    AND (
      "id" = 'cat_quartz'
      OR lower("slug") LIKE 'ana-digi%'
      OR lower("slug") IN ('quartz', 'digitemp', 'digi-temp')
      OR lower("name") IN ('ana-digi', 'quartz', 'digi-temp', 'digitemp')
    )
)
OR "categoryId" = 'cat_quartz'
OR (
  lower(trim(coalesce("categoryLabel", ''))) IN ('ana-digi', 'quartz')
  AND coalesce("categoryId", '') != 'cat_ana-digi'
);

DELETE FROM "ProductCategory"
WHERE "id" != 'cat_ana-digi'
  AND (
    "id" = 'cat_quartz'
    OR lower("slug") LIKE 'ana-digi%'
    OR lower("slug") IN ('quartz', 'digitemp', 'digi-temp')
    OR lower("name") IN ('ana-digi', 'quartz', 'digi-temp', 'digitemp')
  );

UPDATE "ProductCategory"
SET "name" = 'ANA-DIGI', "slug" = 'ana-digi', "sortOrder" = 4
WHERE "id" = 'cat_ana-digi';

-- ---------- DIGITAL ----------
UPDATE "ProductCategory"
SET "id" = 'cat_digital', "name" = 'Digital', "slug" = 'digital', "sortOrder" = 3
WHERE "id" = (
  SELECT "id" FROM "ProductCategory"
  WHERE "id" != 'cat_digital'
    AND (lower("slug") = 'digital' OR lower("name") = 'digital')
    AND NOT EXISTS (SELECT 1 FROM "ProductCategory" WHERE "id" = 'cat_digital')
  LIMIT 1
);

INSERT OR IGNORE INTO "ProductCategory" ("id", "name", "slug", "sortOrder", "createdAt")
VALUES ('cat_digital', 'Digital', 'digital', 3, CURRENT_TIMESTAMP);

UPDATE "ProductCategory"
SET "slug" = printf('digital__legacy_%s', substr("id", -6))
WHERE "id" != 'cat_digital' AND lower("slug") = 'digital';

UPDATE "CatalogProduct"
SET "categoryId" = 'cat_digital',
    "categoryLabel" = 'Digital',
    "storefrontCategory" = NULL,
    "storefrontSubcategory" = NULL,
    "storefrontSeries" = NULL
WHERE coalesce("categoryId", '') IN (
  SELECT "id" FROM "ProductCategory"
  WHERE "id" != 'cat_digital'
    AND (lower("slug") LIKE 'digital%' OR lower("name") = 'digital')
)
OR (
  lower(trim(coalesce("categoryLabel", ''))) = 'digital'
  AND coalesce("categoryId", '') != 'cat_digital'
);

DELETE FROM "ProductCategory"
WHERE "id" != 'cat_digital'
  AND (lower("slug") LIKE 'digital%' OR lower("name") = 'digital');

UPDATE "ProductCategory"
SET "name" = 'Digital', "slug" = 'digital', "sortOrder" = 3
WHERE "id" = 'cat_digital';

-- ---------- ANALOG ----------
UPDATE "ProductCategory"
SET "id" = 'cat_analog', "name" = 'Analog', "slug" = 'analog', "sortOrder" = 2
WHERE "id" = (
  SELECT "id" FROM "ProductCategory"
  WHERE "id" != 'cat_analog'
    AND (lower("slug") = 'analog' OR lower("name") = 'analog')
    AND NOT EXISTS (SELECT 1 FROM "ProductCategory" WHERE "id" = 'cat_analog')
  LIMIT 1
);

INSERT OR IGNORE INTO "ProductCategory" ("id", "name", "slug", "sortOrder", "createdAt")
VALUES ('cat_analog', 'Analog', 'analog', 2, CURRENT_TIMESTAMP);

UPDATE "ProductCategory"
SET "slug" = printf('analog__legacy_%s', substr("id", -6))
WHERE "id" != 'cat_analog' AND lower("slug") = 'analog';

UPDATE "CatalogProduct"
SET "categoryId" = 'cat_analog',
    "categoryLabel" = 'Analog',
    "storefrontCategory" = NULL,
    "storefrontSubcategory" = NULL,
    "storefrontSeries" = NULL
WHERE coalesce("categoryId", '') IN (
  SELECT "id" FROM "ProductCategory"
  WHERE "id" != 'cat_analog'
    AND (lower("slug") LIKE 'analog%' OR lower("name") = 'analog')
)
OR (
  lower(trim(coalesce("categoryLabel", ''))) = 'analog'
  AND coalesce("categoryId", '') != 'cat_analog'
);

DELETE FROM "ProductCategory"
WHERE "id" != 'cat_analog'
  AND (lower("slug") LIKE 'analog%' OR lower("name") = 'analog');

UPDATE "ProductCategory"
SET "name" = 'Analog', "slug" = 'analog', "sortOrder" = 2
WHERE "id" = 'cat_analog';

-- ---------- AUTOMATIC (legacy cat_mechanical) ----------
UPDATE "ProductCategory"
SET "id" = 'cat_automatic', "name" = 'Automatic', "slug" = 'automatic', "sortOrder" = 1
WHERE "id" = (
  SELECT "id" FROM "ProductCategory"
  WHERE "id" != 'cat_automatic'
    AND (
      "id" = 'cat_mechanical'
      OR lower("slug") IN ('automatic', 'mechanical')
    )
    AND NOT EXISTS (SELECT 1 FROM "ProductCategory" WHERE "id" = 'cat_automatic')
  ORDER BY CASE WHEN "id" = 'cat_mechanical' THEN 0 ELSE 1 END
  LIMIT 1
);

INSERT OR IGNORE INTO "ProductCategory" ("id", "name", "slug", "sortOrder", "createdAt")
VALUES ('cat_automatic', 'Automatic', 'automatic', 1, CURRENT_TIMESTAMP);

UPDATE "ProductCategory"
SET "slug" = printf('automatic__legacy_%s', substr("id", -6))
WHERE "id" != 'cat_automatic'
  AND lower("slug") IN ('automatic', 'mechanical');

UPDATE "CatalogProduct"
SET "categoryId" = 'cat_automatic',
    "categoryLabel" = 'Automatic',
    "storefrontCategory" = 'mechanical',
    "storefrontSubcategory" = NULL,
    "storefrontSeries" = NULL
WHERE coalesce("categoryId", '') IN (
  SELECT "id" FROM "ProductCategory"
  WHERE "id" != 'cat_automatic'
    AND (
      "id" = 'cat_mechanical'
      OR lower("slug") LIKE 'automatic%'
      OR lower("slug") IN ('mechanical', 'mechanical__legacy')
      OR lower("name") IN ('automatic', 'mechanical')
    )
)
OR "categoryId" = 'cat_mechanical'
OR (
  lower(trim(coalesce("categoryLabel", ''))) IN ('automatic', 'mechanical')
  AND coalesce("categoryId", '') != 'cat_automatic'
);

DELETE FROM "ProductCategory"
WHERE "id" != 'cat_automatic'
  AND (
    "id" = 'cat_mechanical'
    OR lower("slug") LIKE 'automatic%'
    OR lower("slug") IN ('mechanical')
    OR lower("name") IN ('automatic', 'mechanical')
  );

UPDATE "ProductCategory"
SET "name" = 'Automatic', "slug" = 'automatic', "sortOrder" = 1
WHERE "id" = 'cat_automatic';
