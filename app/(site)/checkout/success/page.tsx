"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useCart } from "@/components/cart/cart-context";

function SuccessInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const paypalId = searchParams.get("paypal_order_id");
  const { clear } = useCart();

  useEffect(() => {
    if (sessionId || paypalId) {
      clear();
    }
  }, [sessionId, paypalId, clear]);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-serif text-3xl tracking-tight">Thank you</h1>
      <p className="mt-4 text-muted">
        Your payment was received. You will get a confirmation by email when
        fulfillment details are available.
      </p>
      {(sessionId || paypalId) && (
        <p className="mt-4 break-all text-xs text-muted">
          Reference: {sessionId || paypalId}
        </p>
      )}
      <Link
        href="/shop"
        className="mt-8 inline-block rounded-2xl bg-ink px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
      >
        Continue shopping
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-20 text-center text-muted">
          Loading…
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
