"use client";

import { useEffect, useRef } from "react";
import { trackVisitorEvent } from "@/lib/visitor-analytics-client";

const SENT_KEY_PREFIX = "humpbuck_purchase_sent_v1";

export function TrackPurchase({
  orderId,
  totalUsd,
  provider,
}: {
  orderId: string;
  totalUsd: number;
  provider?: string | null;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    try {
      if (sessionStorage.getItem(`${SENT_KEY_PREFIX}:${orderId}`) === "1") return;
      sessionStorage.setItem(`${SENT_KEY_PREFIX}:${orderId}`, "1");
    } catch {
      // ignore
    }
    trackVisitorEvent({
      type: "purchase",
      orderId,
      source: provider ?? null,
      meta: { totalUsd, provider: provider ?? null, channel: provider ?? null },
    });
  }, [orderId, provider, totalUsd]);

  return null;
}
