import { redirectWithLocale } from "@/lib/storefront-redirect";

/** Legacy — scroll to inline review form on the product page. */
export default async function AccountOrderProductReviewPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { slug: productSlug } = await params;
  return redirectWithLocale(`/product/${encodeURIComponent(productSlug)}#buyer-reviews`);
}
