import { revalidateTag } from "next/cache";
import { revalidateStorefrontPath } from "@/lib/revalidate-storefront";

/** Bust catalog cache and key storefront routes after admin catalog changes. */
export function revalidateCatalogStorefront(opts?: { slug?: string; oldSlug?: string }): void {
  revalidateTag("catalog", "seconds");
  revalidateStorefrontPath("/");
  revalidateStorefrontPath("/product");

  const slugs = new Set<string>();
  if (opts?.slug?.trim()) slugs.add(opts.slug.trim());
  if (opts?.oldSlug?.trim()) slugs.add(opts.oldSlug.trim());

  for (const slug of slugs) {
    revalidateTag(`catalog-product-${slug}`, "seconds");
    revalidateStorefrontPath(`/product/${encodeURIComponent(slug)}`);
  }
}
