"use client";

import { useEffect, useRef } from "react";
import {
  useCart,
  type PaidOrderCartLine,
} from "@/components/cart/cart-context";

const CART_PAID_REMOVED_KEY = "humpbuck_cart_paid_removed_v1";

export function CheckoutSuccessClient({
  orderId,
  documentTitle,
  syncCartFromPaidOrder = false,
  paidOrderLines = [],
}: {
  orderId: string;
  documentTitle: string;
  /** Remove only lines from this paid order; keep other bag items. */
  syncCartFromPaidOrder?: boolean;
  paidOrderLines?: PaidOrderCartLine[];
}) {
  const { removePaidOrderLines } = useCart();
  const cartSynced = useRef(false);

  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);

  useEffect(() => {
    if (!syncCartFromPaidOrder || cartSynced.current || !paidOrderLines.length) {
      return;
    }
    try {
      if (sessionStorage.getItem(`${CART_PAID_REMOVED_KEY}:${orderId}`) === "1") {
        cartSynced.current = true;
        return;
      }
      sessionStorage.setItem(`${CART_PAID_REMOVED_KEY}:${orderId}`, "1");
    } catch {
      // ignore
    }
    cartSynced.current = true;
    removePaidOrderLines(paidOrderLines);
  }, [syncCartFromPaidOrder, paidOrderLines, orderId, removePaidOrderLines]);

  return null;
}
