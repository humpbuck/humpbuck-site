import { Link } from "@/i18n/navigation";
import { redirectWithLocale } from "@/lib/storefront-redirect";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { ReviewAppendForm } from "@/components/account/review-append-form";
import { MAX_REVIEW_APPENDS } from "@/lib/review-append-constants";
import { getProductBySlug } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

export default async function ReviewAppendPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: reviewId } = await params;
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("AccountReview");

  const session = await auth();
  if (!session?.user?.id) {
    return redirectWithLocale(`/auth/login?callbackUrl=/account/reviews/${reviewId}/append`);
  }
  const userId = session.user.id;

  const review = await prisma.productReview.findFirst({
    where: { id: reviewId, userId },
    include: { _count: { select: { appends: true } } },
  });
  if (!review) notFound();

  const product = await getProductBySlug(review.productSlug);
  if (!product) notFound();

  if (review._count.appends >= MAX_REVIEW_APPENDS) {
    return redirectWithLocale(`/product/${review.productSlug}`);
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {t("appendKicker")}
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">{product.name}</h1>
      <p className="mt-2 text-sm text-muted">
        {t("appendIntro")}{" "}
        <Link
          href={`/product/${review.productSlug}`}
          className="font-semibold underline-offset-4 hover:underline"
        >
          {t("backToProduct")}
        </Link>
      </p>

      <div className="mt-8 max-w-xl rounded-2xl border border-line bg-white/60 p-6">
        <ReviewAppendForm
          reviewId={review.id}
          productSlug={review.productSlug}
          productName={product.name}
        />
      </div>
    </div>
  );
}
