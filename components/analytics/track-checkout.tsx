"use client";

import { useEffect, useRef } from "react";
import { trackVisitorEvent } from "@/lib/visitor-analytics-client";

export function TrackCheckout({
  stage,
  orderId,
  totalUsd,
  paymentMethod,
}: {
  stage: "begin_checkout" | "payment_start" | "payment_success" | "payment_fail";
  orderId?: string | null;
  totalUsd?: number | null;
  paymentMethod?: string | null;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackVisitorEvent({
      type:
        stage === "begin_checkout"
          ? "checkout_start"
          : stage === "payment_start"
            ? "payment_start"
            : stage === "payment_success"
              ? "payment_success"
              : "payment_fail",
      orderId: orderId ?? undefined,
      meta: {
        stage,
        totalUsd: totalUsd ?? null,
        paymentMethod: paymentMethod ?? null,
      },
    });
  }, [orderId, paymentMethod, stage, totalUsd]);

  return null;
}
