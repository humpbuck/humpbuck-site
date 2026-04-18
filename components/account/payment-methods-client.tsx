"use client";

import type { SavedPaymentMethod } from "@prisma/client";
import { useState } from "react";

export function PaymentMethodsClient({
  initialItems,
}: {
  initialItems: SavedPaymentMethod[];
}) {
  const [items, setItems] = useState(initialItems);
  const [label, setLabel] = useState("");
  const [brand, setBrand] = useState("Visa");
  const [last4, setLast4] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || null,
          brand,
          last4,
          expMonth: expMonth ? parseInt(expMonth, 10) : null,
          expYear: expYear ? parseInt(expYear, 10) : null,
        }),
      });
      const data = (await res.json()) as SavedPaymentMethod & { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not add");
      setItems((prev) => [data, ...prev]);
      setLabel("");
      setLast4("");
      setExpMonth("");
      setExpYear("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    setErr(null);
    const res = await fetch(`/api/account/payment-methods?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setErr(data.error || "Could not remove");
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Payment methods
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">Saved cards</h1>
      <p className="mt-2 text-sm text-muted">
        Store a label and the last four digits for your records. For production,
        card vaulting should use your payment provider (e.g. Stripe).
      </p>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No payment methods saved yet.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((pm) => (
            <li
              key={pm.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--color-line)] bg-white/60 px-4 py-3"
            >
              <div>
                <p className="font-medium text-ink">
                  {pm.brand} ·••• {pm.last4}
                </p>
                {pm.label && (
                  <p className="text-xs text-muted">{pm.label}</p>
                )}
                {(pm.expMonth != null || pm.expYear != null) && (
                  <p className="text-xs text-muted">
                    Expires {pm.expMonth ?? "—"}/{pm.expYear ?? "—"}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => void remove(pm.id)}
                className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-ink"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={add}
        className="mt-10 rounded-2xl border border-[color:var(--color-line)] bg-white/60 p-5"
      >
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/85">
          Add payment method
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Label (optional)
            </span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Personal Visa"
              className="mt-1 w-full rounded-xl border border-[color:var(--color-line)] bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Brand
            </span>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[color:var(--color-line)] bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
            >
              {["Visa", "Mastercard", "Amex", "Other"].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Last 4 digits
            </span>
            <input
              value={last4}
              onChange={(e) =>
                setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              inputMode="numeric"
              maxLength={4}
              placeholder="4242"
              className="mt-1 w-full rounded-xl border border-[color:var(--color-line)] bg-paper px-3 py-2 text-sm tabular-nums outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Exp. month
            </span>
            <input
              value={expMonth}
              onChange={(e) =>
                setExpMonth(e.target.value.replace(/\D/g, "").slice(0, 2))
              }
              inputMode="numeric"
              placeholder="MM"
              className="mt-1 w-full rounded-xl border border-[color:var(--color-line)] bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Exp. year
            </span>
            <input
              value={expYear}
              onChange={(e) =>
                setExpYear(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              inputMode="numeric"
              placeholder="YYYY"
              className="mt-1 w-full rounded-xl border border-[color:var(--color-line)] bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
            />
          </label>
        </div>
        {err && (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {err}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || last4.length !== 4}
          className="mt-6 rounded-2xl bg-ink px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90 disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add"}
        </button>
      </form>
    </div>
  );
}
