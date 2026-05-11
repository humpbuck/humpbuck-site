import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProductReviewForm } from "@/components/account/product-review-form";
import { orderDisplayCode } from "@/lib/admin/order-ui";
import { getProductBySlug } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import {
  orderContainsProductSlug,
  orderStatusAllowsReview,
} from "@/lib/review-eligibility";

export default async function AccountOrderProductReviewPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id: orderId, slug: productSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/account/orders/${orderId}/review/${productSlug}`);
  }

  const product = getProductBySlug(productSlug);
  if (!product) notFound();

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id, deletedAt: null },
  });
  if (!order) notFound();

  if (!orderStatusAllowsReview(order.status)) {
    return (
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          Reviews
        </p>
        <h1 className="mt-2 font-serif text-2xl tracking-tight">Not available</h1>
        <p className="mt-3 text-sm text-muted">
          Reviews can be submitted after payment is confirmed for this order.
        </p>
        <Link
          href={`/account/orders/${orderId}`}
          className="mt-6 inline-block text-sm font-semibold underline-offset-4 hover:underline"
        >
          ← Back to order
        </Link>
      </div>
    );
  }

  if (!orderContainsProductSlug(order, productSlug)) {
    notFound();
  }

  const existing = await prisma.productReview.findUnique({
    where: {
      userId_orderId_productSlug: {
        userId: session.user.id,
        orderId,
        productSlug,
      },
    },
  });
  if (existing) {
    redirect(`/product/${productSlug}`);
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Write a review
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">{product.name}</h1>
      <p className="mt-2 text-sm text-muted">
        <Link
          href={`/account/orders/${orderId}`}
          className="font-semibold underline-offset-4 hover:underline"
        >
          ← Order #{orderDisplayCode(order)}
        </Link>
      </p>

      <div className="mt-8 max-w-xl rounded-2xl border border-line bg-white/60 p-6">
        <ProductReviewForm
          orderId={orderId}
          productSlug={productSlug}
          productName={product.name}
        />
      </div>
    </div>
  );
}
