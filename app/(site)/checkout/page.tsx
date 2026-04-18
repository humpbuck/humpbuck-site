"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice, getProductBySlug } from "@/lib/catalog";
import {
  captureTrafficAttribution,
  getTrafficSourceForCheckout,
} from "@/lib/traffic-attribution";

export default function CheckoutPage() {
  const { items, itemCount } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"stripe" | "paypal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      setEmail((e) => e || session.user?.email || "");
    }
  }, [session?.user?.email]);

  useEffect(() => {
    captureTrafficAttribution();
  }, []);

  const subtotal = items.reduce((sum, line) => {
    const p = getProductBySlug(line.slug);
    if (!p) return sum;
    return sum + p.price * line.qty;
  }, 0);

  const resolvedEmail = useMemo(() => {
    return (email.trim() || session?.user?.email || "").trim();
  }, [email, session?.user?.email]);

  const canCheckout =
    itemCount > 0 &&
    resolvedEmail.length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedEmail);

  async function payStripe() {
    setError(null);
    setLoading("stripe");
    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          email: resolvedEmail,
          trafficSource: getTrafficSourceForCheckout(),
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No redirect URL");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(null);
    }
  }

  async function payPaypal() {
    setError(null);
    setLoading("paypal");
    try {
      const res = await fetch("/api/checkout/paypal/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          email: resolvedEmail,
          trafficSource: getTrafficSourceForCheckout(),
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "PayPal failed");
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No redirect URL");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(null);
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center text-muted">
        Loading…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-muted">Your bag is empty.</p>
        <Link
          href="/shop"
          className="mt-4 inline-block text-sm font-semibold uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
        >
          Shop catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-w-0 max-w-lg px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="font-serif text-3xl tracking-tight">Checkout</h1>
      <p className="mt-2 text-sm text-muted">
        Total due:{" "}
        <span className="font-semibold tabular-nums text-ink">
          {formatPrice(subtotal)}
        </span>
      </p>

      <div className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="checkout-email"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted"
          >
            Email for receipt
          </label>
          <input
            id="checkout-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={session?.user?.email || "you@example.com"}
            className="mt-2 w-full rounded-xl border border-[color:var(--color-line)] bg-paper px-4 py-3 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
          />
          {session?.user?.email && (
            <p className="mt-1 text-xs text-muted">
              Signed in as {session.user.email}. You can override the email
              above.
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          disabled={!canCheckout || loading !== null}
          onClick={payStripe}
          className="rounded-2xl bg-[#635BFF] px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#544dcc] disabled:opacity-50"
        >
          {loading === "stripe" ? "Redirecting…" : "Pay with Stripe"}
        </button>
        <button
          type="button"
          disabled={!canCheckout || loading !== null}
          onClick={payPaypal}
          className="rounded-2xl border border-[#0070ba] bg-[#0070ba] px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#005ea6] disabled:opacity-50"
        >
          {loading === "paypal" ? "Redirecting…" : "Pay with PayPal"}
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="underline-offset-4 hover:underline"
        >
          Back to bag
        </button>
      </p>
    </div>
  );
}
