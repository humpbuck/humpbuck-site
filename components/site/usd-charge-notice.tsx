"use client";

import { useTranslations } from "next-intl";
import { useDisplayCurrencyOptional } from "@/components/site/display-currency-context";

export function UsdChargeNotice({ className }: { className?: string }) {
  const t = useTranslations("DisplayCurrency");
  const ctx = useDisplayCurrencyOptional();
  if (!ctx || ctx.currency === "USD") return null;

  return (
    <p className={className ?? "text-xs leading-relaxed text-muted"}>{t("usdChargeNotice")}</p>
  );
}
