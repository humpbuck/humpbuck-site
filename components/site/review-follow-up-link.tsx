"use client";

import { Link } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { MAX_REVIEW_APPENDS } from "@/lib/review-append-constants";

export function ReviewFollowUpLink({
  reviewId,
  reviewUserId,
  appendCount,
}: {
  reviewId: string;
  reviewUserId: string;
  appendCount: number;
}) {
  const { data: session } = useSession();
  const t = useTranslations("Reviews");

  if (!session?.user?.id || session.user.id !== reviewUserId) return null;
  if (appendCount >= MAX_REVIEW_APPENDS) return null;

  return (
    <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em]">
      <Link
        href={`/account/reviews/${reviewId}/append`}
        className="text-ink underline-offset-4 hover:underline"
      >
        {t("addFollowUp")}
      </Link>
    </p>
  );
}
