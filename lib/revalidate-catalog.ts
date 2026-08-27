import { revalidateTag } from "next/cache";
import { revalidateStorefrontPath, revalidateSitemap } from "@/lib/revalidate-storefront";
import { STOREFRONT_WATCH_COLLECTION_PATHS } from "@/lib/storefront-watch-categories";

/** Bust catalog cache and key storefront routes after admin catalog changes. */
export function revalidateCatalogStorefront(opts?: { slug?: string; oldSlug?: string }): void {
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
    revalidateStorefrontPath(`/product/${encodeURIComponent(slug)}`);
  }
}
