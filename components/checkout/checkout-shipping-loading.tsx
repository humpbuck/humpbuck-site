"use client";

import { useTranslations } from "next-intl";

/** Shown while checkout shipping chunk loads (dynamic import). */
export function CheckoutShippingLoading() {
  const t = useTranslations("CheckoutShipping");
  return (
    <div className="rounded-2xl border border-line bg-white/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">{t("feeTitle")}</h2>
          <p className="mt-1 text-xs text-muted">{t("loadingOptions")}</p>
        </div>
      </div>
    </div>
  );
}
