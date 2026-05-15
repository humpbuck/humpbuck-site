"use client";

import { useEffect } from "react";
import { TrackPurchase } from "@/components/analytics/track-purchase";

export function CheckoutSuccessClient({ orderId, totalUsd, provider }: { orderId: string; totalUsd: number; provider?: string | null; }) {
  useEffect(() => {
    document.title = "Order confirmed · HUMPBUCK";
  }, []);

  return <TrackPurchase orderId={orderId} totalUsd={totalUsd} provider={provider} />;
}
