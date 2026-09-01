import { revalidateTag } from "next/cache";
import { revalidateStorefrontPath, revalidateSitemap } from "@/lib/revalidate-storefront";
import { PRODUCT_PATH_CATEGORIES } from "@/lib/product-path";
import { STOREFRONT_WATCH_COLLECTION_PATHS } from "@/lib/storefront-watch-categories";

/** Bust legacy + `/product/{category}/{slug}` paths for one model slug. */
export function revalidateProductStorefrontPaths(slug: string): void {
  const trimmed = slug.trim();
  if (!trimmed) return;
  const enc = encodeURIComponent(trimmed);
  revalidateStorefrontPath(`/product/${enc}`);
  for (const category of PRODUCT_PATH_CATEGORIES) {
    revalidateStorefrontPath(`/product/${category}/${enc}`);
  }
  // Former ANA-DIGI path alias (now 308 → ana-digi).
  revalidateStorefrontPath(`/product/digi-temp/${enc}`);
}

/** Bust catalog cache and key storefront routes after admin catalog changes. */
export function revalidateCatalogStorefront(opts?: {
  slug?: string;
  oldSlug?: string;
}): void {
  revalidateTag("catalog", { expire: 0 });
  revalidateSitemap();
  revalidateStorefrontPath("/");
  for (const path of STOREFRONT_WATCH_COLLECTION_PATHS) {
    revalidateStorefrontPath(path);
  }

  const slugs = new Set<string>();
  if (opts?.slug?.trim()) slugs.add(opts.slug.trim());
  if (opts?.oldSlug?.trim()) slugs.add(opts.oldSlug.trim());

  for (const slug of slugs) {
    revalidateTag(`catalog-product-${slug}`, { expire: 0 });
    revalidateProductStorefrontPaths(slug);
  }
}
