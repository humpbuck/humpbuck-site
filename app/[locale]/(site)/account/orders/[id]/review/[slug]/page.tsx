import { redirectWithLocale } from "@/lib/storefront-redirect";
import { productHrefForSlug } from "@/lib/product-path-server";

/** Legacy — scroll to inline review form on the product page. */
export default async function AccountOrderProductReviewPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { slug: productSlug } = await params;
  const href = await productHrefForSlug(productSlug);
  return redirectWithLocale(`${href}#buyer-reviews`);
}
