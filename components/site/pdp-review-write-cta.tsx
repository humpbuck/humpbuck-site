"use client";

import { Link } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/** PDP “Write a review” — loaded client-side so the cached PDP shell stays static. */
export function PdpReviewWriteCta({ productSlug }: { productSlug: string }) {
  const { data: session, status } = useSession();
  const t = useTranslations("Reviews");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      setOrderId(null);
      return;
    }
    let cancelled = false;
    void fetch(`/api/account/review-cta?productSlug=${encodeURIComponent(productSlug)}`, {
      credentials: "same-origin",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { orderId?: string | null } | null) => {
        if (!cancelled) setOrderId(typeof data?.orderId === "string" ? data.orderId : null);
      })
      .catch(() => {
        if (!cancelled) setOrderId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [productSlug, session?.user?.id, status]);

  if (!orderId) return null;

  return (
    <p className="text-sm text-ink/90">
      <Link
        href={`/account/orders/${orderId}/review/${encodeURIComponent(productSlug)}`}
        className="font-semibold underline-offset-4 hover:underline"
      >
        {t("writeReview")}
      </Link>{" "}
      <span className="text-muted">{t("writeReviewHint")}</span>
    </p>
  );
}
