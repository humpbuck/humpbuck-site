import { buyerOrderStatusLabel } from "@/lib/account-buyer-order";

export function BuyerOrderStatusBlock({
  providerLabel,
  status,
  className,
}: {
  /** Already human-readable (e.g. payment provider name). */
  providerLabel: string;
  status: string;
  className?: string;
}) {
  return (
    <div className={className ?? "text-right"}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        Order status
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted">
        {providerLabel} · {buyerOrderStatusLabel(status)}
      </p>
    </div>
  );
}
