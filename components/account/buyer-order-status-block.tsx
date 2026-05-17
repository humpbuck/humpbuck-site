import { buyerOrderStatusLabel } from "@/lib/account-buyer-order";

export function BuyerOrderStatusBlock({
  providerLabel,
  status,
  statusDisplay,
  orderStatusHeading,
  className,
}: {
  /** Already human-readable (e.g. payment provider name). */
  providerLabel: string;
  status: string;
  /** Overrides the default English `buyerOrderStatusLabel(status)` when provided. */
  statusDisplay?: string;
  /** Defaults to “Order status” when omitted (pass from next-intl in storefront). */
  orderStatusHeading?: string;
  className?: string;
}) {
  const line = statusDisplay ?? buyerOrderStatusLabel(status);
  const heading = orderStatusHeading ?? "Order status";

  return (
    <div className={className ?? "text-right"}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {heading}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted">
        {providerLabel} · {line}
      </p>
    </div>
  );
}
