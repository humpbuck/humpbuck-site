"use client";

import { useTranslations } from "next-intl";

export function ProductFiveStarRating({
  count,
  className = "",
  compact = false,
}: {
  count: number;
  className?: string;
  compact?: boolean;
}) {
  const t = useTranslations("Product");

  return (
    <div
      className={`flex items-center gap-1 ${className}`.trim()}
      aria-label={t("cardFiveStarReviews", { count })}
    >
      <span
        className={`leading-none text-amber-500 ${
          compact ? "text-[10px] tracking-[0.06em] sm:text-[11px]" : "text-[11px] tracking-[0.08em] sm:text-xs"
        }`}
        aria-hidden
      >
        ★★★★★
      </span>
      <span
        className={`tabular-nums text-ink/55 ${
          compact ? "text-[10px] sm:text-[11px]" : "text-[11px] sm:text-xs"
        }`}
      >
        ({count})
      </span>
    </div>
  );
}
