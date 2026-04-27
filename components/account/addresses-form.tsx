"use client";

import type { UserAddress } from "@prisma/client";
import { useState } from "react";
import {
  PHONE_COUNTRY_CODE_DATALIST_ID,
  PHONE_COUNTRY_CODES,
  normalizeCountryCodeInput,
  normalizePhone,
  splitPhoneForInput,
} from "@/lib/phone-normalize";

type Addr = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
};

function fromRow(row: UserAddress | null | undefined): Addr {
  if (!row) {
    return {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      phone: "",
    };
  }
  return {
    line1: row.line1,
    line2: row.line2 ?? "",
    city: row.city,
    state: row.state ?? "",
    postalCode: row.postalCode,
    country: row.country,
    phone: row.phone ?? "",
  };
}

export function AddressesForm({
  initialBilling,
  initialShipping,
}: {
  initialBilling: UserAddress | null;
  initialShipping: UserAddress | null;
}) {
  const [billing, setBilling] = useState<Addr>(() => fromRow(initialBilling));
  const [shipping, setShipping] = useState<Addr>(() => fromRow(initialShipping));
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billing,
          shipping,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg("Addresses saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Addresses
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">
        Billing & shipping
      </h1>
      <p className="mt-2 text-sm text-muted">
        Used for invoices and delivery. You can update these any time.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <AddressBlock
          title="Billing address"
          value={billing}
          onChange={setBilling}
        />
        <AddressBlock
          title="Shipping address"
          value={shipping}
          onChange={setShipping}
        />
      </div>

      {err && (
        <p className="mt-6 text-sm text-red-700" role="alert">
          {err}
        </p>
      )}
      {msg && (
        <p className="mt-6 text-sm text-green-800" role="status">
          {msg}
        </p>
      )}

      <button
        type="button"
        onClick={() => void save()}
        disabled={loading}
        className="mt-8 rounded-2xl bg-ink px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save addresses"}
      </button>
    </div>
  );
}

function AddressBlock({
  title,
  value,
  onChange,
}: {
  title: string;
  value: Addr;
  onChange: (a: Addr) => void;
}) {
  function patch<K extends keyof Addr>(key: K, v: Addr[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="rounded-2xl border border-line bg-white/60 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/85">
        {title}
      </h2>
      <div className="mt-4 space-y-3">
        <Field
          label="Address line 1"
          value={value.line1}
          onChange={(v) => patch("line1", v)}
        />
        <Field
          label="Address line 2"
          value={value.line2}
          onChange={(v) => patch("line2", v)}
        />
        <Field
          label="City"
          value={value.city}
          onChange={(v) => patch("city", v)}
        />
        <Field
          label="State / province"
          value={value.state}
          onChange={(v) => patch("state", v)}
        />
        <Field
          label="Postal code"
          value={value.postalCode}
          onChange={(v) => patch("postalCode", v)}
        />
        <Field
          label="Country"
          value={value.country}
          onChange={(v) => patch("country", v)}
        />
        <Field
          label="Phone"
          value={value.phone}
          onChange={(v) => patch("phone", v)}
          isPhone
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  isPhone = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  isPhone?: boolean;
}) {
  const phoneParts = splitPhoneForInput(value);
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </span>
      {isPhone ? (
        <div className="mt-1 grid grid-cols-[120px_1fr] gap-2">
          <input
            value={phoneParts.countryCode}
            list={PHONE_COUNTRY_CODE_DATALIST_ID}
            inputMode="tel"
            placeholder="+86"
            onChange={(e) =>
              onChange(normalizePhone(normalizeCountryCodeInput(e.target.value), phoneParts.localNumber))
            }
            onBlur={(e) =>
              onChange(
                normalizePhone(
                  normalizeCountryCodeInput(e.target.value) || "+86",
                  phoneParts.localNumber,
                ),
              )
            }
            className="rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
          />
          <input
            value={phoneParts.localNumber}
            inputMode="numeric"
            onChange={(e) => onChange(normalizePhone(phoneParts.countryCode, e.target.value))}
            className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
          />
        </div>
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
        />
      )}
      {isPhone ? (
        <datalist id={PHONE_COUNTRY_CODE_DATALIST_ID}>
          {PHONE_COUNTRY_CODES.map((code) => (
            <option key={code} value={code} />
          ))}
        </datalist>
      ) : null}
    </label>
  );
}
