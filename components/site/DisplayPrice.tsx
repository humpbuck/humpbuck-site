"use client";

import { formatPrice } from "@/lib/catalog";
import { useDisplayCurrencyOptional } from "@/components/site/display-currency-context";

export function DisplayPrice({
  usd,
  className,
  primaryClassName,
  referenceClassName = "text-xs text-muted",
  stack = true,
  hideReference = false,
}: {
  usd: number;
  className?: string;
  primaryClassName?: string;
  referenceClassName?: string;
  /** Vertical stack (default) or inline primary + reference. */
  stack?: boolean;
  hideReference?: boolean;
}) {
  const ctx = useDisplayCurrencyOptional();
  const primary = formatPrice(usd);
  const currency = ctx?.currency ?? "USD";
  const reference =
    ctx &&
    !hideReference &&
    currency !== "USD" &&
    ctx.ratesReady
      ? ctx.formatReference(usd)
      : null;

  if (!reference) {
    return (
      <span className={[primaryClassName ?? "tabular-nums", className].filter(Boolean).join(" ")}>
        {primary}
      </span>
    );
  }

  if (stack) {
    return (
      <div className={className}>
        <span className={primaryClassName ?? "tabular-nums"}>{primary}</span>
        <span className={[referenceClassName, "tabular-nums"].join(" ")}>≈ {reference}</span>
      </div>
    );
  }

  return (
    <span className={className}>
      <span className={primaryClassName ?? "tabular-nums"}>{primary}</span>
      <span className={[referenceClassName, "tabular-nums ml-1"].join(" ")}>≈ {reference}</span>
    </span>
  );
}
