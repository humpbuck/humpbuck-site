import Link from "next/link";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { adminPath } from "@/lib/admin-path";
import { DeleteReviewButton } from "@/components/admin/delete-review-button";
import { MerchantReplyBox } from "@/components/admin/merchant-reply-box";
import { ReviewModerationButtons } from "@/components/admin/review-moderation-buttons";

import { prisma } from "@/lib/prisma";
import { parseReviewImageUrls } from "@/lib/product-reviews-queries";

export const metadata = {
  title: "Reviews — Admin",
};

export default async function AdminReviewsPage() {
  const rows = await prisma.productReview.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 500,
    include: {
      user: { select: { email: true, name: true, firstName: true, lastName: true } },
    },
  });

  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="font-serif text-3xl tracking-tight">Reviews</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        New reviews stay <strong>pending</strong> until you approve them. Approved
        reviews appear on the product page; rejected reviews stay hidden. You can
        still reply to approved reviews or delete spam.
      </p>

      {rows.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No reviews in the database yet.</p>
      ) : (
        <div className="mt-10 overflow-x-auto rounded-2xl border border-line bg-paper/80">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Buyer</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Comment</th>
                <th className="px-4 py-3">Store reply</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Photos</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const title = r.productSlug;
                const email = r.user?.email ?? "—";
                const fullName = [r.user?.firstName?.trim(), r.user?.lastName?.trim()]
                  .filter(Boolean)
                  .join(" ")
                  .trim();
                const legacyName = r.user?.name?.trim();
                const displayName = fullName || legacyName;
                const buyer = displayName ? `${displayName} · ${email}` : email;
                const imgs = parseReviewImageUrls(r.imageUrlsJson);
                const when = new Date(r.createdAt).toLocaleString("en-US", {
                  dateStyle: "short",
                  timeStyle: "short",
                });
                const excerpt =
                  r.body.length > 160 ? `${r.body.slice(0, 160)}…` : r.body;

                return (
                  <tr
                    key={r.id}
                    className="border-b border-line/80 align-top last:border-b-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted">
                      {when}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/product/${encodeURIComponent(r.productSlug)}`}
                        className="font-medium text-ink underline-offset-4 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {title}
                      </Link>
                      <p className="mt-0.5 text-[10px] text-muted">{r.productSlug}</p>
                    </td>
                    <td className="max-w-[200px] px-4 py-3 break-all text-muted">
                      {buyer}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-amber-700">
                      {"★".repeat(r.rating)}
                      <span className="text-muted">{"☆".repeat(5 - r.rating)}</span>
                    </td>
                    <td className="max-w-md px-4 py-3 text-ink/90">
                      <p className="whitespace-pre-wrap leading-relaxed">{excerpt}</p>
                    </td>
                    <td className="align-top px-4 py-3">
                      <MerchantReplyBox
                        reviewId={r.id}
                        initialReply={r.merchantReply}
                        initialAt={
                          r.merchantRepliedAt
                            ? r.merchantRepliedAt.toISOString()
                            : null
                        }
                      />
                    </td>
                    <td className="align-top px-4 py-3">
                      <ReviewModerationButtons reviewId={r.id} status={r.status} />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">{imgs.length}</td>
                    <td className="px-4 py-3">
                      <DeleteReviewButton reviewId={r.id} label={title} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
