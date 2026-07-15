import { formatExchangeRateSummary, getCnyUsdExchangeRate } from "@/lib/cny-usd-exchange";

export async function AdminExchangeRateCard() {
  const rate = await getCnyUsdExchangeRate();
  const updated = new Date(rate.fetchedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="rounded-2xl border border-line bg-white/60 px-5 py-4 text-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        USD / CNY rate
      </p>
      <p className="mt-2 font-serif text-2xl tabular-nums text-ink">
        {formatExchangeRateSummary(rate)}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">
        Checkout shipping is entered in ¥ and shown to buyers in USD at this rate.
        {rate.source === "fallback" ? " Using fallback — live API unavailable." : " Cached ~1 hour."}
      </p>
      <p className="mt-1 text-[10px] text-muted">Updated {updated}</p>
    </div>
  );
}
