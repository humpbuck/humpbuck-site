"use client";

import { useEffect } from "react";
import { TrackPurchase } from "@/components/analytics/track-purchase";

export function CheckoutSuccessClient({
  orderId,
  totalUsd,
  provider,
  documentTitle,
}: {
  orderId: string;
  totalUsd: number;
  provider?: string | null;
  documentTitle: string;
}) {
  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);

  return <TrackPurchase orderId={orderId} totalUsd={totalUsd} provider={provider} />;
}
